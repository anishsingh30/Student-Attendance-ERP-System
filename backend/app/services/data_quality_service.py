import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.models.attendance import Attendance, AttendanceCorrection
from app.models.student import Student
from app.models.subject import Subject
from app.models.user import User

logger = logging.getLogger("attendance.data_quality")

def assess_data_quality_and_anomalies(db: Session) -> Dict[str, Any]:
    """
    Performs institutional data quality checks and flags integrity signals.
    Terminology: 'Data Integrity Anomaly' (neutral, objective metrics for review).
    """
    total_records = db.query(Attendance).count()
    total_corrections = db.query(AttendanceCorrection).count()
    total_students = db.query(Student).count()
    total_subjects = db.query(Subject).count()

    anomalies: List[Dict[str, Any]] = []

    # 1. Check for high correction frequency per student
    correction_by_student = db.query(
        Attendance.student_id,
        func.count(AttendanceCorrection.id).label("correction_count")
    ).join(AttendanceCorrection, Attendance.id == AttendanceCorrection.attendance_id)\
     .group_by(Attendance.student_id)\
     .having(func.count(AttendanceCorrection.id) >= 3)\
     .all()

    for st_id, count in correction_by_student:
        st = db.query(Student).filter(Student.id == st_id).first()
        anomalies.append({
            "anomaly_type": "HIGH_CORRECTION_FREQUENCY",
            "severity": "MEDIUM",
            "entity": f"Student: {st.roll_number if st else f'ID {st_id}'}",
            "details": f"Student has {count} historical attendance corrections recorded.",
            "recommendation": "Review attendance edit reasons with marking faculty."
        })

    # 2. Check for zero-conducted subjects with enrolled students
    subjects_without_records = []
    for sub in db.query(Subject).all():
        cnt = db.query(Attendance).filter(Attendance.subject_id == sub.id).count()
        if cnt == 0:
            subjects_without_records.append(sub.code)
    
    if subjects_without_records:
        anomalies.append({
            "anomaly_type": "MISSING_SESSION_RECORDS",
            "severity": "LOW",
            "entity": f"Subjects: {', '.join(subjects_without_records[:5])}",
            "details": f"{len(subjects_without_records)} active subject(s) have 0 recorded lecture sessions.",
            "recommendation": "Verify if timetable classes have commenced for these subjects."
        })

    date_absences = db.query(
        Attendance.date,
        Attendance.subject_id,
        func.count(Attendance.id).label("total_marked"),
        func.sum(case((Attendance.status == 'ABSENT', 1), else_=0)).label("absent_count")
    ).group_by(Attendance.date, Attendance.subject_id).all()

    for dt, sub_id, tot, abs_cnt in date_absences:
        if tot >= 5 and (abs_cnt / tot) >= 0.75:
            sub = db.query(Subject).filter(Subject.id == sub_id).first()
            anomalies.append({
                "anomaly_type": "MASS_ABSENCE_EVENT",
                "severity": "INFO",
                "entity": f"Date {dt} - Subject {sub.code if sub else sub_id}",
                "details": f"{abs_cnt} out of {tot} students ({int((abs_cnt/tot)*100)}%) marked absent.",
                "recommendation": "Check for departmental events, holidays, or campus placement drives."
            })

    correction_rate = round((total_corrections / max(1, total_records)) * 100, 2)
    overall_health = "EXCELLENT" if correction_rate < 5.0 and len(anomalies) <= 2 else ("GOOD" if correction_rate < 15.0 else "REVIEW_RECOMMENDED")

    return {
        "status": "ANALYSIS_COMPLETE",
        "data_health_rating": overall_health,
        "total_attendance_records": total_records,
        "total_corrections": total_corrections,
        "correction_rate_percentage": correction_rate,
        "active_students_monitored": total_students,
        "active_subjects_monitored": total_subjects,
        "anomalies_detected_count": len(anomalies),
        "integrity_anomalies": anomalies
    }
