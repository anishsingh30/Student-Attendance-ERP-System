import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.agent import AgentRun, AgentLog
from app.models.student import Student
from app.models.subject import Subject
from app.models.alert import Alert
from app.models.notification import Notification
from app.tools.attendance_tools import AttendanceTools
from app.agents.llm_provider import llm_provider
from app.agents.state_machine import AgentStateMachine, AgentStage, AgentStatus
from app.services.threshold_service import get_active_threshold, determine_risk_level
from app.services.email_service import email_service
from app.ml.predictor import ml_predictor

class AttendanceMonitoringAgent:
    """
    Autonomous State-Aware Agentic AI orchestrator for university attendance governance.
    Combines:
    1. Deterministic statutory arithmetic (exact percentages, recovery requirements).
    2. ML predictive risk trajectory (probabilistic debarment forecasting & feature analysis).
    3. Multi-path dynamic decision branching (critical deficits, early trajectory warnings,
       borderline advisories, and automatic compliance resolution).
    4. Automated multi-channel notification dispatch (in-app + asynchronous SMTP email).
    5. Immutable audit observability and idempotency protection.
    """

    def __init__(self, db: Session, triggered_by_user_id: Optional[int] = None, trigger_type: str = "MANUAL"):
        self.db = db
        self.triggered_by = triggered_by_user_id
        self.trigger_type = trigger_type
        self.tools = AttendanceTools(db)

    def run(
        self,
        department: Optional[str] = None,
        semester: Optional[int] = None,
        threshold_override: Optional[float] = None,
        force_notify: bool = False
    ) -> Dict[str, Any]:
        sm = AgentStateMachine.create_run(
            self.db, 
            triggered_by=self.triggered_by, 
            trigger_type=self.trigger_type
        )
        agent_run = sm.run

        try:
            # 1. FETCHING_DATA
            sm.transition_to(
                AgentStage.FETCHING_DATA,
                f"Fetching student rosters for department='{department or 'ALL'}', semester='{semester or 'ALL'}'."
            )
            q = self.db.query(Student)
            if department:
                q = q.filter(Student.department == department)
            if semester:
                q = q.filter(Student.semester == semester)
            students = q.all()
            total_students = len(students)
            sm.run.students_analyzed = total_students
            self.db.commit()

            sm.record_tool_call("query_students", f"dept={department}, sem={semester}", f"{total_students} students found")

            # 2. CALCULATING
            sm.transition_to(
                AgentStage.CALCULATING,
                f"Computing deterministic statutory attendance metrics for {total_students} student profiles."
            )

            all_records: List[Dict[str, Any]] = []
            for st in students:
                dept_subs = self.db.query(Subject).filter(
                    Subject.department == st.department,
                    Subject.semester == st.semester
                ).all()

                for sub in dept_subs:
                    m = self.tools.calculate_attendance(st.id, sub.id)
                    if m["classes_conducted"] > 0:
                        all_records.append({
                            "student": st,
                            "subject": sub,
                            "metrics": m
                        })

            sm.record_tool_call("calculate_attendance_batch", f"{len(all_records)} course records", "Calculated statutory metrics")

            # 3. EVALUATING_THRESHOLDS
            sm.transition_to(
                AgentStage.EVALUATING_THRESHOLDS,
                "Evaluating subject attendance against institutional statutory policies."
            )
            active_threshold = get_active_threshold(self.db)
            green_cutoff = threshold_override if threshold_override is not None else active_threshold.green_min
            yellow_cutoff = active_threshold.yellow_min
            orange_cutoff = active_threshold.orange_min

            # 4. ML_RISK_ANALYSIS
            sm.transition_to(
                AgentStage.ML_RISK_ANALYSIS,
                f"Executing Machine Learning risk inference across {len(all_records)} academic records."
            )

            for rec in all_records:
                st = rec["student"]
                sub = rec["subject"]
                ml_pred = ml_predictor.predict_student_subject(self.db, st.id, sub.id)
                rec["ml_prediction"] = ml_pred

            sm.record_tool_call(
                "ml_risk_inference_batch",
                f"{len(all_records)} records analyzed",
                "Extracted probabilistic debarment risk and trajectory features"
            )

            # 5. DECISION_BRANCHING & IDENTIFYING_RISK
            sm.transition_to(
                AgentStage.DECISION_BRANCHING,
                "Evaluating dynamic decision matrix combining statutory rules and ML predictive signals."
            )

            critical_cases: List[Dict[str, Any]] = []
            shortage_cases: List[Dict[str, Any]] = []
            borderline_cases: List[Dict[str, Any]] = []
            recovered_cases: List[Dict[str, Any]] = []
            safe_cases: List[Dict[str, Any]] = []

            for rec in all_records:
                pct = rec["metrics"]["percentage"]
                ml_info = rec["ml_prediction"]
                debarment_prob = ml_info.get("debarment_risk_probability", 0.0)

                # Branch 1: Critical Statutory Deficit (<65%)
                if pct < orange_cutoff:
                    rec["decision_branch"] = "CRITICAL_DEFICIT"
                    rec["effective_risk_level"] = "RED"
                    critical_cases.append(rec)

                # Branch 2: Imminent Shortage (65-74.9% OR >75% with high ML debarment risk due to sharp absence streak)
                elif pct < yellow_cutoff or (pct < green_cutoff and debarment_prob >= 0.55):
                    rec["decision_branch"] = "SHORTAGE_TRAJECTORY_ELEVATED" if debarment_prob >= 0.55 else "SHORTAGE_DEFICIT"
                    rec["effective_risk_level"] = "ORANGE" if pct < yellow_cutoff else "YELLOW"
                    shortage_cases.append(rec)

                # Branch 3: Borderline Advisory (75-79.9% with stable trajectory)
                elif pct < green_cutoff:
                    rec["decision_branch"] = "BORDERLINE_ADVISORY"
                    rec["effective_risk_level"] = "YELLOW"
                    borderline_cases.append(rec)

                # Branch 4 & 5: Compliant (>=80%) -> Check if previous active alert exists for auto-resolution
                else:
                    active_alert = self.db.query(Alert).filter(
                        Alert.student_id == rec["student"].id,
                        Alert.subject_id == rec["subject"].id,
                        Alert.is_resolved == False
                    ).first()

                    if active_alert:
                        rec["decision_branch"] = "AUTO_RESOLVE_RECOVERED"
                        rec["active_alert"] = active_alert
                        recovered_cases.append(rec)
                    else:
                        rec["decision_branch"] = "SAFE_COMPLIANT"
                        safe_cases.append(rec)

            total_at_risk = len(critical_cases) + len(shortage_cases) + len(borderline_cases)
            sm.run.at_risk_found = total_at_risk
            self.db.commit()

            sm.log_step(
                AgentStage.IDENTIFYING_RISK,
                f"Decision Matrix: Critical={len(critical_cases)}, Shortage={len(shortage_cases)}, "
                f"Borderline={len(borderline_cases)}, Recovered={len(recovered_cases)}, Safe={len(safe_cases)}"
            )

            # 6. AUTO_RESOLVING (Auto-resolve recovered alerts)
            if recovered_cases:
                sm.transition_to(
                    AgentStage.AUTO_RESOLVING,
                    f"Auto-resolving previous alerts for {len(recovered_cases)} recovered students now meeting compliance."
                )
                for rec in recovered_cases:
                    alert_to_resolve = rec["active_alert"]
                    alert_to_resolve.is_resolved = True
                    self.db.commit()

                    # Create positive reinforcement notification
                    st = rec["student"]
                    sub = rec["subject"]
                    if st.user_id:
                        notif = self.tools.send_notification(
                            user_id=st.user_id,
                            title=f"Attendance Recovered: {sub.code}",
                            message=f"Congratulations! Your attendance in {sub.name} is now {rec['metrics']['percentage']}%, restoring good academic standing.",
                            notification_type="RECOVERY",
                            alert_id=alert_to_resolve.id
                        )
                        if email_service:
                            email_service.dispatch_notification_email(self.db, notif.id)

            # 7. CREATING_ALERT & IDEMPOTENCY RESOLUTION
            actionable_cases = critical_cases + shortage_cases + borderline_cases
            sm.transition_to(
                AgentStage.CREATING_ALERT,
                "Evaluating alert idempotency and preparing official academic interventions."
            )

            created_alerts: List[Alert] = []
            skipped_duplicates = 0
            cutoff_dt = datetime.now(timezone.utc) - timedelta(hours=24)
            cases_to_publish: List[Dict[str, Any]] = []

            for item in actionable_cases:
                st = item["student"]
                sub = item["subject"]
                risk_lvl = item["effective_risk_level"]

                if not force_notify:
                    existing_alert = self.db.query(Alert).filter(
                        Alert.student_id == st.id,
                        Alert.subject_id == sub.id,
                        Alert.is_resolved == False
                    ).first()

                    if existing_alert:
                        created_dt = existing_alert.created_at
                        if created_dt:
                            if created_dt.tzinfo is None:
                                created_dt = created_dt.replace(tzinfo=timezone.utc)

                            if existing_alert.risk_level == risk_lvl and created_dt >= cutoff_dt:
                                skipped_duplicates += 1
                                continue
                            elif existing_alert.risk_level != risk_lvl:
                                # Risk level changed (escalated or modified): resolve previous alert
                                existing_alert.is_resolved = True
                                self.db.commit()

                cases_to_publish.append(item)

            # 8. GENERATING_EXPLANATION (Personalized qualitative guidance for new/escalated alerts)
            if cases_to_publish:
                sm.transition_to(
                    AgentStage.GENERATING_EXPLANATION,
                    f"Generating qualitative academic guidance and recovery pathways for {len(cases_to_publish)} alerts."
                )

                for item in cases_to_publish:
                    st = item["student"]
                    sub = item["subject"]
                    m = item["metrics"]
                    ml_info = item["ml_prediction"]
                    student_name = st.user.full_name if st.user else "Student"
                    risk_lvl = item["effective_risk_level"]

                    narrative = llm_provider.generate_personalized_alert_explanation(
                        student_name=student_name,
                        subject_name=sub.name,
                        current_pct=m["percentage"],
                        required_pct=m["required_threshold"],
                        attended=m["classes_attended"],
                        conducted=m["classes_conducted"],
                        classes_needed=m["consecutive_classes_needed"],
                        risk_level=risk_lvl
                    )

                    alert = self.tools.generate_alert(
                        student_id=st.id,
                        subject_id=sub.id,
                        risk_level=risk_lvl,
                        current_pct=m["percentage"],
                        required_pct=m["required_threshold"],
                        attended=m["classes_attended"],
                        conducted=m["classes_conducted"],
                        classes_required=m["consecutive_classes_needed"],
                        title=narrative["title"],
                        explanation=narrative["explanation"],
                        recommended_action=narrative["recommended_action"]
                    )
                    created_alerts.append(alert)

            sm.run.alerts_created = len(created_alerts)
            self.db.commit()
            sm.log_step(
                AgentStage.CREATING_ALERT,
                f"Published {len(created_alerts)} new alerts ({skipped_duplicates} duplicate active alerts suppressed via idempotency)."
            )

            # 9. DISPATCHING_NOTIFICATION (Multi-channel in-app + automatic SMTP email dispatch)
            sm.transition_to(
                AgentStage.DISPATCHING_NOTIFICATION,
                f"Delivering multi-channel in-app and email notifications for {len(created_alerts)} new alerts."
            )

            notifs_sent = 0
            for alert in created_alerts:
                user_id = alert.student.user_id if alert.student else None
                if user_id:
                    notif = self.tools.send_notification(
                        user_id=user_id,
                        title=alert.title,
                        message=f"{alert.explanation} Recommended action: {alert.recommended_action}",
                        notification_type="CRITICAL" if alert.risk_level == "RED" else "WARNING",
                        alert_id=alert.id
                    )
                    # Automatically attempt asynchronous/safe email dispatch
                    email_service.dispatch_notification_email(self.db, notif.id)
                    notifs_sent += 1

            sm.run.notifications_sent = notifs_sent
            self.db.commit()

            # 10. AUDITING
            sm.transition_to(
                AgentStage.AUDITING,
                "Recording immutable security audit log for autonomous monitoring cycle."
            )
            self.tools.create_audit_log(
                user_id=self.triggered_by,
                action="AGENT_EXECUTION_COMPLETED",
                resource="AttendanceMonitoringAgent",
                details={
                    "run_id": agent_run.id,
                    "trigger_type": self.trigger_type,
                    "students_analyzed": total_students,
                    "at_risk_found": total_at_risk,
                    "alerts_created": len(created_alerts),
                    "notifications_sent": notifs_sent,
                    "duplicates_suppressed": skipped_duplicates,
                    "recovered_resolved": len(recovered_cases)
                }
            )

            # 11. COMPLETED
            summary_parts = [
                f"Completed monitoring cycle ({self.trigger_type}).",
                f"Evaluated {total_students} students across academic course records.",
                f"Identified {total_at_risk} attendance deficit cases ({len(critical_cases)} critical <{orange_cutoff}%, {len(shortage_cases)} warning)."
            ]
            if len(created_alerts) > 0:
                summary_parts.append(f"Created {len(created_alerts)} new personalized alerts and dispatched {notifs_sent} notifications.")
            else:
                if total_at_risk > 0:
                    summary_parts.append(f"0 new alerts created ({skipped_duplicates} existing active alerts retained under 24-hour idempotency cooldown).")
                else:
                    summary_parts.append("All monitored students meet institutional compliance thresholds.")

            if len(recovered_cases) > 0:
                summary_parts.append(f"Auto-resolved {len(recovered_cases)} recovered cases now in good standing.")

            summary = " ".join(summary_parts)
            sm.complete(summary)

            return {
                "run_id": agent_run.id,
                "status": "COMPLETED",
                "current_stage": "COMPLETED",
                "trigger_type": self.trigger_type,
                "students_analyzed": total_students,
                "at_risk_found": total_at_risk,
                "critical_cases_count": len(critical_cases),
                "warning_cases_count": len(shortage_cases),
                "alerts_created": len(created_alerts),
                "duplicates_suppressed": skipped_duplicates,
                "recovered_resolved": len(recovered_cases),
                "notifications_sent": notifs_sent,
                "summary": summary
            }

        except Exception as e:
            self.db.rollback()
            sm.fail(str(e))
            raise e

