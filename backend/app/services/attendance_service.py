from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.attendance import Attendance
from app.models.student import Student
from app.models.subject import Subject, FacultySubject
from app.models.faculty import Faculty
from app.models.user import User
from app.models.alert import Alert
from app.models.notification import Notification
from app.services.recovery_calculator import (
    calculate_percentage,
    calculate_consecutive_needed,
    calculate_max_missable,
    calculate_projected_attendance
)
from app.services.threshold_service import get_active_threshold, determine_risk_level, get_risk_badge_label
from app.schemas.student import SubjectAttendanceDetail, AttendanceTrendPoint, StudentDashboardResponse

def get_student_subject_attendance(
    db: Session,
    student_id: int,
    subject_id: int
) -> Dict[str, Any]:
    """
    Deterministically computes attendance statistics for a specific student in a specific subject.
    """
    threshold = get_active_threshold(db)

    # Count attended and total conducted
    conducted = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.subject_id == subject_id
    ).count()

    attended = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.subject_id == subject_id,
        Attendance.status == "PRESENT"
    ).count()

    percentage = calculate_percentage(attended, conducted)
    risk_level = determine_risk_level(percentage, threshold)
    consecutive_needed = calculate_consecutive_needed(attended, conducted, threshold.yellow_min)
    max_missable = calculate_max_missable(attended, conducted, threshold.yellow_min)

    subject = db.query(Subject).filter(Subject.id == subject_id).first()

    return {
        "student_id": student_id,
        "subject_id": subject_id,
        "subject_code": subject.code if subject else "N/A",
        "subject_name": subject.name if subject else "N/A",
        "classes_attended": attended,
        "classes_conducted": conducted,
        "percentage": percentage,
        "risk_level": risk_level,
        "required_threshold": threshold.yellow_min,
        "is_at_risk": risk_level in ["YELLOW", "ORANGE", "RED"],
        "consecutive_classes_needed": consecutive_needed,
        "max_classes_can_miss": max_missable,
        "status_label": get_risk_badge_label(risk_level)
    }

def get_student_dashboard_data(db: Session, student_id: int) -> StudentDashboardResponse:
    """
    Deterministically aggregates overall and subject-wise metrics for a student dashboard.
    Uses bulk aggregation queries and fast in-memory calculations to eliminate N+1 latency.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise ValueError("Student not found")

    threshold = get_active_threshold(db)

    # 1. Get all subjects relevant to student's department & semester
    subjects = db.query(Subject).filter(
        Subject.department == student.department,
        Subject.semester == student.semester
    ).all()

    # If no department/semester match, fallback to all subjects with attendance records
    if not subjects:
        subject_ids = db.query(Attendance.subject_id).filter(Attendance.student_id == student_id).distinct().all()
        subjects = db.query(Subject).filter(Subject.id.in_([s[0] for s in subject_ids])).all()

    # 2. Bulk aggregate attended and conducted counts per subject in a single SQL query
    from sqlalchemy import case
    att_stats = db.query(
        Attendance.subject_id,
        func.count(Attendance.id).label("conducted"),
        func.sum(case((Attendance.status == "PRESENT", 1), else_=0)).label("attended")
    ).filter(
        Attendance.student_id == student_id
    ).group_by(Attendance.subject_id).all()

    stats_map = {row.subject_id: (row.conducted or 0, row.attended or 0) for row in att_stats}

    # 3. Bulk fetch faculty assignments for these subjects
    sub_ids = [s.id for s in subjects]
    faculty_subs = db.query(FacultySubject).filter(FacultySubject.subject_id.in_(sub_ids)).all() if sub_ids else []
    faculty_map = {}
    for fs in faculty_subs:
        if fs.faculty and fs.faculty.user:
            faculty_map[fs.subject_id] = fs.faculty.user.full_name

    total_attended = 0
    total_conducted = 0
    subjects_detail: List[SubjectAttendanceDetail] = []
    below_threshold_count = 0
    critical_count = 0

    for sub in subjects:
        faculty_name = faculty_map.get(sub.id, "Department Faculty")
        conducted, attended = stats_map.get(sub.id, (0, 0))

        percentage = calculate_percentage(attended, conducted)
        risk_level = determine_risk_level(percentage, threshold)
        consecutive_needed = calculate_consecutive_needed(attended, conducted, threshold.yellow_min)
        max_missable = calculate_max_missable(attended, conducted, threshold.yellow_min)

        total_attended += attended
        total_conducted += conducted

        if percentage < threshold.yellow_min:
            below_threshold_count += 1
        if risk_level == "RED":
            critical_count += 1

        subjects_detail.append(SubjectAttendanceDetail(
            subject_id=sub.id,
            subject_code=sub.code,
            subject_name=sub.name,
            faculty_name=faculty_name,
            classes_attended=attended,
            classes_conducted=conducted,
            percentage=percentage,
            risk_level=risk_level,
            required_threshold=threshold.yellow_min,
            is_at_risk=risk_level in ["YELLOW", "ORANGE", "RED"],
            consecutive_classes_needed=consecutive_needed,
            max_classes_can_miss=max_missable,
            status_label=get_risk_badge_label(risk_level)
        ))

    overall_pct = calculate_percentage(total_attended, total_conducted)
    overall_risk = determine_risk_level(overall_pct, threshold)

    # 4. Active alerts & unread notifications count in bulk
    active_alerts = db.query(Alert).filter(
        Alert.student_id == student_id,
        Alert.is_resolved == False
    ).count()

    unread_notifs = db.query(Notification).filter(
        Notification.user_id == student.user_id,
        Notification.is_read == False
    ).count()

    # 5. In-memory cumulative trend points calculation (O(N) single query instead of 2*N queries)
    trends: List[AttendanceTrendPoint] = []
    attendance_chronological = db.query(Attendance.date, Attendance.status).filter(
        Attendance.student_id == student_id
    ).order_by(Attendance.date.asc()).all()

    if attendance_chronological:
        # Group records by date
        date_records = {}
        for d, st in attendance_chronological:
            if d not in date_records:
                date_records[d] = {"conducted": 0, "attended": 0}
            date_records[d]["conducted"] += 1
            if st == "PRESENT":
                date_records[d]["attended"] += 1

        sorted_dates = sorted(date_records.keys())
        running_cond = 0
        running_att = 0
        step = max(1, len(sorted_dates) // 6)

        for i, dt in enumerate(sorted_dates):
            running_cond += date_records[dt]["conducted"]
            running_att += date_records[dt]["attended"]
            if i % step == 0 or i == len(sorted_dates) - 1:
                pct = calculate_percentage(running_att, running_cond)
                trends.append(AttendanceTrendPoint(
                    label=dt.strftime("%b %d"),
                    percentage=pct,
                    attended=running_att,
                    conducted=running_cond
                ))

    if not trends:
        trends = [AttendanceTrendPoint(label="Current", percentage=overall_pct, attended=total_attended, conducted=total_conducted)]

    return StudentDashboardResponse(
        student_id=student.id,
        user_id=student.user_id,
        full_name=student.user.full_name if student.user else "Student",
        roll_number=student.roll_number,
        department=student.department,
        semester=student.semester,
        overall_percentage=overall_pct,
        overall_risk_level=overall_risk,
        total_subjects=len(subjects_detail),
        subjects_below_threshold=below_threshold_count,
        critical_subjects_count=critical_count,
        active_alerts_count=active_alerts,
        unread_notifications_count=unread_notifs,
        subjects=subjects_detail,
        attendance_trends=trends
    )

def get_faculty_class_overview(db: Session, faculty_id: int) -> Dict[str, Any]:
    """
    Computes class-wide metrics for faculty: total students, class average,
    count of at-risk students, subject-wise analytics.
    """
    threshold = get_active_threshold(db)

    # Get subjects assigned to this faculty
    faculty_subs = db.query(FacultySubject).filter(FacultySubject.faculty_id == faculty_id).all()
    subject_ids = [fs.subject_id for fs in faculty_subs]

    # If no specific assignment, get first 2 subjects as fallback
    if not subject_ids:
        all_subs = db.query(Subject).limit(2).all()
        subject_ids = [s.id for s in all_subs]

    subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).all()

    # Find students enrolled in these departments/semesters
    dept_sem_pairs = {(s.department, s.semester) for s in subjects}
    students = []
    for dept, sem in dept_sem_pairs:
        st_list = db.query(Student).filter(Student.department == dept, Student.semester == sem).all()
        students.extend(st_list)

    if not students:
        students = db.query(Student).limit(25).all()

    # Deduplicate students
    unique_students = {s.id: s for s in students}.values()

    student_stats = []
    total_att_sum = 0
    total_cond_sum = 0
    below_thresh_count = 0
    critical_count = 0

    for st in unique_students:
        st_att = 0
        st_cond = 0
        for sub_id in subject_ids:
            cond = db.query(Attendance).filter(Attendance.student_id == st.id, Attendance.subject_id == sub_id).count()
            att = db.query(Attendance).filter(Attendance.student_id == st.id, Attendance.subject_id == sub_id, Attendance.status == "PRESENT").count()
            st_att += att
            st_cond += cond

        pct = calculate_percentage(st_att, st_cond)
        risk = determine_risk_level(pct, threshold)
        if pct < threshold.yellow_min:
            below_thresh_count += 1
        if risk == "RED":
            critical_count += 1

        total_att_sum += st_att
        total_cond_sum += st_cond

        student_stats.append({
            "student_id": st.id,
            "roll_number": st.roll_number,
            "name": st.user.full_name if st.user else "Student",
            "department": st.department,
            "semester": st.semester,
            "attended": st_att,
            "conducted": st_cond,
            "percentage": pct,
            "risk_level": risk,
            "status_label": get_risk_badge_label(risk)
        })

    class_avg = calculate_percentage(total_att_sum, total_cond_sum)

    # Subject breakdown
    sub_breakdown = []
    for s in subjects:
        cond = db.query(Attendance).filter(Attendance.subject_id == s.id).count()
        att = db.query(Attendance).filter(Attendance.subject_id == s.id, Attendance.status == "PRESENT").count()
        pct = calculate_percentage(att, cond)
        sub_breakdown.append({
            "subject_id": s.id,
            "code": s.code,
            "name": s.name,
            "total_records": cond,
            "average_percentage": pct
        })

    return {
        "total_students": len(unique_students),
        "class_average_percentage": class_avg,
        "students_below_threshold": below_thresh_count,
        "critical_risk_students": critical_count,
        "required_threshold": threshold.yellow_min,
        "subjects": sub_breakdown,
        "student_roster": student_stats
    }
