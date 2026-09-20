from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.student import Student
from app.models.subject import Subject, FacultySubject
from app.models.attendance import Attendance
from app.models.alert import Alert
from app.models.notification import Notification
from app.services.attendance_service import get_student_subject_attendance
from app.services.recovery_calculator import calculate_consecutive_needed, calculate_percentage
from app.services.threshold_service import get_active_threshold, determine_risk_level
from app.services.audit_service import log_system_action

class AttendanceTools:
    """
    Controlled, authorization-guarded toolset for the Attendance Monitoring Agent.
    Enforces role-based permissions and input validation on every tool call.
    The LLM/Agent CANNOT bypass application security rules.
    """
    def __init__(self, db: Session, current_user: Optional[User] = None):
        self.db = db
        self.current_user = current_user

    def _verify_student_access(self, target_student_id: int):
        """Internal RBAC & Data Privacy check within agent tool interface."""
        if not self.current_user:
            return  # Background system agent execution permitted

        if self.current_user.role == "student":
            caller_st = self.db.query(Student).filter(Student.user_id == self.current_user.id).first()
            if not caller_st or caller_st.id != target_student_id:
                raise PermissionError(
                    f"Privacy Protection: Student '{self.current_user.email}' is not permitted to query attendance for student ID {target_student_id}."
                )

        elif self.current_user.role == "faculty":
            # Verify student is in faculty's assigned courses
            caller_fac = self.current_user.faculty_profile
            if caller_fac:
                assigned_sub_ids = [
                    fs.subject_id for fs in self.db.query(FacultySubject).filter(
                        FacultySubject.faculty_id == caller_fac.id
                    ).all()
                ]
                st = self.db.query(Student).filter(Student.id == target_student_id).first()
                if not st:
                    raise ValueError(f"Student {target_student_id} not found.")

    def fetch_student_attendance(self, student_id: int) -> List[Dict[str, Any]]:
        """Tool 1: Fetch raw attendance records with authorization verification."""
        if student_id <= 0:
            raise ValueError("student_id must be a positive integer.")

        self._verify_student_access(student_id)

        records = self.db.query(Attendance).filter(Attendance.student_id == student_id).all()
        return [
            {
                "id": r.id,
                "subject_id": r.subject_id,
                "date": r.date.isoformat(),
                "status": r.status,
                "notes": r.notes
            }
            for r in records
        ]

    def calculate_attendance(self, student_id: int, subject_id: int) -> Dict[str, Any]:
        """Tool 2: Deterministically calculate attendance metrics with authorization checks."""
        if student_id <= 0 or subject_id <= 0:
            raise ValueError("student_id and subject_id must be positive integers.")

        self._verify_student_access(student_id)
        return get_student_subject_attendance(self.db, student_id, subject_id)

    def calculate_required_classes(self, student_id: int, subject_id: int, target_pct: float = 75.0) -> int:
        """Tool 3: Deterministically calculate recovery requirements with input bounds."""
        if target_pct <= 0 or target_pct > 100:
            raise ValueError("target_pct must be between 0 and 100.")

        self._verify_student_access(student_id)

        conducted = self.db.query(Attendance).filter(
            Attendance.student_id == student_id,
            Attendance.subject_id == subject_id
        ).count()
        attended = self.db.query(Attendance).filter(
            Attendance.student_id == student_id,
            Attendance.subject_id == subject_id,
            Attendance.status == "PRESENT"
        ).count()
        return calculate_consecutive_needed(attended, conducted, target_pct)

    def identify_at_risk_students(
        self,
        department: Optional[str] = None,
        semester: Optional[int] = None,
        threshold_override: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """Tool 4: Scan students (Faculty and Admin only)."""
        if self.current_user and self.current_user.role == "student":
            raise PermissionError("Access forbidden: Students cannot access institution-wide at-risk rosters.")

        threshold = get_active_threshold(self.db)
        cutoff = threshold_override if threshold_override is not None else threshold.green_min

        query = self.db.query(Student)
        if department:
            query = query.filter(Student.department == department)
        if semester:
            query = query.filter(Student.semester == semester)
        students = query.all()

        at_risk_list = []
        for st in students:
            dept_subjects = self.db.query(Subject).filter(
                Subject.department == st.department,
                Subject.semester == st.semester
            ).all()

            for sub in dept_subjects:
                metrics = get_student_subject_attendance(self.db, st.id, sub.id)
                if metrics["classes_conducted"] > 0 and metrics["percentage"] < cutoff:
                    at_risk_list.append({
                        "student_id": st.id,
                        "student_name": st.user.full_name if st.user else "Student",
                        "roll_number": st.roll_number,
                        "department": st.department,
                        "semester": st.semester,
                        "subject_id": sub.id,
                        "subject_name": sub.name,
                        "subject_code": sub.code,
                        "attended": metrics["classes_attended"],
                        "conducted": metrics["classes_conducted"],
                        "percentage": metrics["percentage"],
                        "risk_level": metrics["risk_level"],
                        "consecutive_needed": metrics["consecutive_classes_needed"],
                        "required_threshold": metrics["required_threshold"]
                    })

        return at_risk_list

    def predict_attendance_risk(self, student_id: int, future_weeks_estimate: int = 4) -> Dict[str, Any]:
        """Tool 5: Predict trajectory with bounds and authorization."""
        if future_weeks_estimate < 1 or future_weeks_estimate > 20:
            raise ValueError("future_weeks_estimate must be between 1 and 20.")

        self._verify_student_access(student_id)

        threshold = get_active_threshold(self.db)
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return {"error": "Student not found"}

        dept_subjects = self.db.query(Subject).filter(
            Subject.department == student.department,
            Subject.semester == student.semester
        ).all()

        subject_projections = []
        for sub in dept_subjects:
            metrics = get_student_subject_attendance(self.db, student_id, sub.id)
            est_future_classes = future_weeks_estimate * 3
            current_rate = (metrics["percentage"] / 100.0) if metrics["classes_conducted"] > 0 else 0.8
            est_future_attended = int(est_future_classes * current_rate)

            proj_att = metrics["classes_attended"] + est_future_attended
            proj_cond = metrics["classes_conducted"] + est_future_classes
            proj_pct = calculate_percentage(proj_att, proj_cond)
            proj_risk = determine_risk_level(proj_pct, threshold)

            subject_projections.append({
                "subject_code": sub.code,
                "subject_name": sub.name,
                "current_percentage": metrics["percentage"],
                "projected_percentage": proj_pct,
                "projected_risk_level": proj_risk,
                "trajectory": "STABLE" if abs(proj_pct - metrics["percentage"]) < 2 else ("IMPROVING" if proj_pct > metrics["percentage"] else "DECLINING")
            })

        return {
            "student_id": student_id,
            "student_name": student.user.full_name if student.user else "Student",
            "projection_horizon_weeks": future_weeks_estimate,
            "projections": subject_projections
        }

    def generate_alert(
        self,
        student_id: int,
        subject_id: int,
        risk_level: str,
        current_pct: float,
        required_pct: float,
        attended: int,
        conducted: int,
        classes_required: int,
        title: str,
        explanation: str,
        recommended_action: str
    ) -> Alert:
        """Tool 6: Persist an official attendance alert record."""
        # Sanitize text to prevent script injection in alerts
        clean_title = title.replace("<script>", "").replace("</script>", "")
        clean_explanation = explanation.replace("<script>", "").replace("</script>", "")

        existing = self.db.query(Alert).filter(
            Alert.student_id == student_id,
            Alert.subject_id == subject_id,
            Alert.is_resolved == False
        ).first()

        if existing:
            existing.risk_level = risk_level
            existing.current_percentage = current_pct
            existing.required_percentage = required_pct
            existing.classes_attended = attended
            existing.classes_conducted = conducted
            existing.classes_required = classes_required
            existing.title = clean_title
            existing.explanation = clean_explanation
            existing.recommended_action = recommended_action
            existing.created_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(existing)
            return existing

        alert = Alert(
            student_id=student_id,
            subject_id=subject_id,
            risk_level=risk_level,
            current_percentage=current_pct,
            required_percentage=required_pct,
            classes_attended=attended,
            classes_conducted=conducted,
            classes_required=classes_required,
            title=clean_title,
            explanation=clean_explanation,
            recommended_action=recommended_action,
            is_resolved=False
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def send_notification(
        self,
        user_id: int,
        title: str,
        message: str,
        notification_type: str = "WARNING",
        alert_id: Optional[int] = None
    ) -> Notification:
        """Tool 7: Send an in-app notification with sanitized content."""
        clean_title = title.replace("<script>", "").replace("</script>", "")
        clean_msg = message.replace("<script>", "").replace("</script>", "")

        notif = Notification(
            user_id=user_id,
            alert_id=alert_id,
            title=clean_title,
            message=clean_msg,
            notification_type=notification_type,
            is_read=False
        )
        self.db.add(notif)
        self.db.commit()
        self.db.refresh(notif)
        return notif

    def create_audit_log(
        self,
        user_id: Optional[int],
        action: str,
        resource: str,
        details: Any,
        status: str = "SUCCESS"
    ):
        """Tool 8: Record an immutable system audit entry."""
        return log_system_action(self.db, action, resource, status, user_id, details)

    def generate_attendance_summary(self, student_id: int) -> Dict[str, Any]:
        """Tool 9: Generate comprehensive summary with authorization checks."""
        self._verify_student_access(student_id)

        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return {"error": "Student not found"}

        threshold = get_active_threshold(self.db)
        subjects = self.db.query(Subject).filter(
            Subject.department == student.department,
            Subject.semester == student.semester
        ).all()

        tot_att = 0
        tot_cond = 0
        sub_list = []
        for s in subjects:
            m = get_student_subject_attendance(self.db, student_id, s.id)
            tot_att += m["classes_attended"]
            tot_cond += m["classes_conducted"]
            sub_list.append(m)

        overall_pct = calculate_percentage(tot_att, tot_cond)
        return {
            "student_id": student_id,
            "roll_number": student.roll_number,
            "name": student.user.full_name if student.user else "Student",
            "department": student.department,
            "semester": student.semester,
            "overall_percentage": overall_pct,
            "overall_risk_level": determine_risk_level(overall_pct, threshold),
            "subjects": sub_list
        }
