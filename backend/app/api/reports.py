import io
import csv
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import require_roles, get_current_user
from app.models.user import User
from app.models.student import Student
from app.models.subject import Subject
from app.models.attendance import Attendance
from app.models.agent import AgentRun
from app.services.attendance_service import get_student_subject_attendance, get_student_dashboard_data
from app.services.threshold_service import get_active_threshold
from app.core.csv_sanitizer import sanitize_csv_row

router = APIRouter(prefix="/reports", tags=["Reports"])

def make_csv_response(filename: str, rows: List[List[Any]]) -> Response:
    output = io.StringIO()
    writer = csv.writer(output)
    for row in rows:
        writer.writerow(sanitize_csv_row(row))
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

# -------------------------------------------------------------
# 1. At-Risk Students Report
# -------------------------------------------------------------
@router.get("/at-risk")
def get_at_risk_report(
    department: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    risk_level: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    th = get_active_threshold(db)
    q = db.query(Student)
    if department:
        q = q.filter(Student.department == department)
    if semester:
        q = q.filter(Student.semester == semester)
    students = q.all()

    at_risk_records = []
    for st in students:
        subs = db.query(Subject).filter(
            Subject.department == st.department,
            Subject.semester == st.semester
        ).all()

        for sub in subs:
            m = get_student_subject_attendance(db, st.id, sub.id)
            if m["classes_conducted"] > 0 and m["percentage"] < th.green_min:
                if risk_level and m["risk_level"].upper() != risk_level.upper():
                    continue

                at_risk_records.append({
                    "student_id": st.id,
                    "student_name": st.user.full_name if st.user else "Student",
                    "roll_number": st.roll_number,
                    "department": st.department,
                    "semester": st.semester,
                    "subject_code": sub.code,
                    "subject_name": sub.name,
                    "classes_attended": m["classes_attended"],
                    "classes_conducted": m["classes_conducted"],
                    "percentage": m["percentage"],
                    "risk_level": m["risk_level"],
                    "consecutive_recovery_needed": m["consecutive_classes_needed"],
                    "required_threshold": th.yellow_min
                })
    return at_risk_records

@router.get("/at-risk/export-csv")
def export_at_risk_csv(
    department: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    risk_level: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    data = get_at_risk_report(department, semester, risk_level, db, current_user)
    rows = [["Roll Number", "Student Name", "Department", "Semester", "Course Code", "Course Name", "Attended", "Conducted", "Percentage", "Risk Level", "Consecutive Classes Needed"]]
    for d in data:
        rows.append([
            d["roll_number"],
            d["student_name"],
            d["department"],
            d["semester"],
            d["subject_code"],
            d["subject_name"],
            d["classes_attended"],
            d["classes_conducted"],
            f"{d['percentage']}%",
            d["risk_level"],
            d["consecutive_recovery_needed"]
        ])
    return make_csv_response(f"at_risk_students_report_{datetime.now().strftime('%Y%m%d')}.csv", rows)

# -------------------------------------------------------------
# 2. Subjects Overview Report
# -------------------------------------------------------------
@router.get("/subjects-overview")
def get_subjects_overview_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    subjects = db.query(Subject).all()
    threshold = get_active_threshold(db)
    results = []
    for s in subjects:
        records = db.query(Student).filter(
            Student.department == s.department,
            Student.semester == s.semester
        ).all()

        tot_att = 0
        tot_cond = 0
        students_below = 0

        for st in records:
            m = get_student_subject_attendance(db, st.id, s.id)
            tot_att += m["classes_attended"]
            tot_cond += m["classes_conducted"]
            if m["classes_conducted"] > 0 and m["percentage"] < threshold.yellow_min:
                students_below += 1

        overall_pct = round((tot_att / tot_cond * 100.0), 2) if tot_cond > 0 else 100.0

        results.append({
            "subject_id": s.id,
            "subject_code": s.code,
            "subject_name": s.name,
            "department": s.department,
            "semester": s.semester,
            "total_enrolled": len(records),
            "total_classes_held": max([get_student_subject_attendance(db, st.id, s.id)["classes_conducted"] for st in records] or [0]),
            "average_percentage": overall_pct,
            "students_below_75": students_below,
            "students_below_threshold": students_below
        })
    return results

@router.get("/subjects-overview/export-csv")
def export_subjects_overview_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    data = get_subjects_overview_report(db, current_user)
    rows = [["Course Code", "Course Name", "Department", "Semester", "Enrolled Students", "Classes Held", "Average Attendance %", "Students Below 75%"]]
    for d in data:
        rows.append([
            d["subject_code"],
            d["subject_name"],
            d["department"],
            d["semester"],
            d["total_enrolled"],
            d["total_classes_held"],
            f"{d['average_percentage']}%",
            d["students_below_75"]
        ])
    return make_csv_response(f"course_subjects_overview_{datetime.now().strftime('%Y%m%d')}.csv", rows)

# -------------------------------------------------------------
# 3. Student Attendance Dossier Report
# -------------------------------------------------------------
@router.get("/student/{student_id}")
def get_student_report(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "student":
        st = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not st or st.id != student_id:
            raise HTTPException(status_code=403, detail="Forbidden: You can only access your own academic report.")

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    return get_student_dashboard_data(db, student_id)

@router.get("/student/{student_id}/export-csv")
def export_student_csv(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "student":
        st = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not st or st.id != student_id:
            raise HTTPException(status_code=403, detail="Forbidden.")

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    records = db.query(Attendance).filter(
        Attendance.student_id == student_id
    ).order_by(Attendance.date.desc()).all()

    rows = [["Date", "Course Code", "Course Name", "Status", "Notes"]]
    for r in records:
        sub = r.subject
        rows.append([
            r.date.isoformat(),
            sub.code if sub else "—",
            sub.name if sub else "—",
            r.status,
            r.notes or "—"
        ])
    return make_csv_response(f"attendance_history_{student.roll_number}_{datetime.now().strftime('%Y%m%d')}.csv", rows)

# -------------------------------------------------------------
# 4. Department Compliance Summary Report
# -------------------------------------------------------------
@router.get("/department")
def get_department_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    threshold = get_active_threshold(db)
    students = db.query(Student).all()
    dept_stats: Dict[str, Dict[str, Any]] = {}

    for st in students:
        dept = st.department
        if dept not in dept_stats:
            dept_stats[dept] = {"department": dept, "total_students": 0, "at_risk_students": 0, "total_percentage_sum": 0.0}

        dept_stats[dept]["total_students"] += 1
        dash = get_student_dashboard_data(db, st.id)
        dept_stats[dept]["total_percentage_sum"] += dash.overall_percentage
        if dash.overall_percentage < threshold.yellow_min:
            dept_stats[dept]["at_risk_students"] += 1

    out = []
    for d in dept_stats.values():
        avg_pct = round(d["total_percentage_sum"] / d["total_students"], 2) if d["total_students"] > 0 else 100.0
        out.append({
            "department": d["department"],
            "total_students": d["total_students"],
            "at_risk_students": d["at_risk_students"],
            "average_attendance": avg_pct,
            "compliance_rate": round(((d["total_students"] - d["at_risk_students"]) / d["total_students"] * 100.0), 2) if d["total_students"] > 0 else 100.0
        })
    return out

@router.get("/department/export-csv")
def export_department_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    data = get_department_report(db, current_user)
    rows = [["Academic Department", "Total Students", "At-Risk Students", "Average Attendance %", "Compliance Rate %"]]
    for d in data:
        rows.append([d["department"], d["total_students"], d["at_risk_students"], f"{d['average_attendance']}%", f"{d['compliance_rate']}%"])
    return make_csv_response(f"department_compliance_report_{datetime.now().strftime('%Y%m%d')}.csv", rows)

# -------------------------------------------------------------
# 5. Agent Run History Report
# -------------------------------------------------------------
@router.get("/agent-runs/export-csv")
def export_agent_runs_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    runs = db.query(AgentRun).order_by(AgentRun.start_time.desc()).limit(100).all()
    rows = [["Run ID", "Trigger Type", "Status", "Started At", "Ended At", "Students Analyzed", "Deficits Found", "Alerts Generated", "Notifications Sent", "Summary"]]
    for r in runs:
        rows.append([
            r.id,
            r.trigger_type,
            r.status,
            r.start_time.isoformat() if r.start_time else "",
            r.end_time.isoformat() if r.end_time else "",
            r.students_analyzed,
            r.at_risk_found,
            r.alerts_created,
            r.notifications_sent,
            r.summary or ""
        ])
    return make_csv_response(f"agent_runs_audit_{datetime.now().strftime('%Y%m%d')}.csv", rows)

# Route aliases for convenience
@router.get("/at-risk/csv")
def export_at_risk_csv_alias(
    department: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    risk_level: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    return export_at_risk_csv(department, semester, risk_level, db, current_user)

@router.get("/subjects")
def get_subjects_overview_alias(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    return get_subjects_overview_report(db, current_user)

@router.get("/subjects/csv")
def export_subjects_csv_alias(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    return export_subjects_overview_csv(db, current_user)

@router.get("/departments")
def get_departments_alias(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    return get_department_report(db, current_user)

@router.get("/departments/csv")
def export_departments_csv_alias(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    return export_department_csv(db, current_user)

@router.get("/agent-runs")
def get_agent_runs_report_alias(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    runs = db.query(AgentRun).order_by(AgentRun.start_time.desc()).limit(100).all()
    out = []
    for r in runs:
        duration = int((r.end_time - r.start_time).total_seconds()) if (r.end_time and r.start_time) else 0
        out.append({
            "run_id": r.id,
            "trigger_type": r.trigger_type,
            "status": r.status,
            "start_time": r.start_time.isoformat() if r.start_time else None,
            "end_time": r.end_time.isoformat() if r.end_time else None,
            "duration_seconds": duration,
            "students_analyzed": r.students_analyzed,
            "at_risk_found": r.at_risk_found,
            "alerts_created": r.alerts_created,
            "notifications_sent": r.notifications_sent,
            "summary": r.summary
        })
    return out

@router.get("/agent-runs/csv")
def export_agent_runs_csv_alias(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    return export_agent_runs_csv(db, current_user)

@router.get("/student/{student_id}/csv")
def export_student_csv_alias(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return export_student_csv(student_id, db, current_user)

# -------------------------------------------------------------
# 5. Intervention Outcomes Analytics (Descriptive & Non-Causal)
# -------------------------------------------------------------
@router.get("/interventions/analytics")
def get_intervention_outcomes_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    from app.models.alert import Alert, AlertIntervention

    total_interventions = db.query(AlertIntervention).count()
    completed_interventions = db.query(AlertIntervention).filter(AlertIntervention.action_type.in_(["RESOLVED", "DISMISSED"])).count()
    
    # Intervention type distribution
    all_invs = db.query(AlertIntervention).all()
    type_counts = {}
    outcomes = {"IMPROVED": 0, "STABLE": 0, "DECLINED": 0, "PENDING": 0}
    
    attendance_diffs = []
    for inv in all_invs:
        t = inv.action_type
        type_counts[t] = type_counts.get(t, 0) + 1
        
        st = inv.outcome_status or "PENDING"
        outcomes[st] = outcomes.get(st, 0) + 1
        
        if inv.attendance_before is not None and inv.attendance_after is not None:
            attendance_diffs.append(inv.attendance_after - inv.attendance_before)

    avg_delta = round(sum(attendance_diffs) / len(attendance_diffs), 2) if attendance_diffs else 0.0

    return {
        "status": "ANALYTICS_COMPLETE",
        "scientific_disclaimer": "Descriptive observational summary only. Observed attendance improvements or regressions are observational and do not constitute causal proof.",
        "total_interventions_recorded": total_interventions,
        "completed_interventions_count": completed_interventions,
        "average_attendance_change_percentage": avg_delta,
        "intervention_type_distribution": type_counts,
        "outcome_distribution": outcomes
    }

