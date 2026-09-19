import re
import time
from typing import Dict, Any, Optional, List, Generator, Tuple
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.services.attendance_service import get_student_dashboard_data, get_faculty_class_overview
from app.services.recovery_calculator import simulate_attendance, calculate_consecutive_needed, calculate_max_missable
from app.agents.llm_provider import llm_provider

class AttendanceAIAssistant:
    """
    Role-aware AI chatbot assistant that binds all natural-language responses
    strictly to verified deterministic calculations, request-scoped memoization,
    and role-based data isolation.
    """
    def __init__(self, db: Session, current_user: User):
        self.db = db
        self.current_user = current_user
        self._cached_student: Optional[Any] = None
        self._cached_dash_data: Optional[Any] = None
        self._cached_faculty_overview: Optional[Any] = None
        self._db_latency_ms: int = 0
        self._calc_latency_ms: int = 0

    def build_authorized_context(self, message: str, history: Optional[List[Dict[str, str]]] = None) -> Tuple[Dict[str, Any], int, int]:
        """
        Builds authoritative, compact, role-isolated context with request-scoped DB memoization.
        Returns (authorized_context, db_latency_ms, calc_latency_ms).
        """
        t0 = time.time()
        role = self.current_user.role.lower()
        full_name = self.current_user.full_name
        q_lower = message.lower()

        authorized_context: Dict[str, Any] = {}

        if role == "student":
            if self._cached_student is None or self._cached_dash_data is None:
                t_db_start = time.time()
                student = self.db.query(Student).filter(Student.user_id == self.current_user.id).first()
                if not student:
                    return {
                        "error": "NO_STUDENT_PROFILE",
                        "reply": "No student profile is linked to your account. Please contact university administration."
                    }, int((time.time() - t_db_start) * 1000), 0
                self._cached_student = student
                self._cached_dash_data = get_student_dashboard_data(self.db, student.id)
                self._db_latency_ms = max(1, int((time.time() - t_db_start) * 1000))

            student = self._cached_student
            dash_data = self._cached_dash_data

            t_calc_start = time.time()
            # Construct concise subject summaries for fast LLM ingestion
            subjects_list = []
            for s in dash_data.subjects:
                s_dict = s.model_dump()
                subjects_list.append({
                    "subject_id": s_dict["subject_id"],
                    "subject_code": s_dict["subject_code"],
                    "subject_name": s_dict["subject_name"],
                    "classes_attended": s_dict["classes_attended"],
                    "classes_conducted": s_dict["classes_conducted"],
                    "percentage": s_dict["percentage"],
                    "risk_level": s_dict["risk_level"],
                    "is_at_risk": s_dict["is_at_risk"],
                    "consecutive_classes_needed": s_dict["consecutive_classes_needed"],
                    "max_classes_can_miss": s_dict["max_classes_can_miss"],
                    "status_label": s_dict["status_label"]
                })

            # 1. Subject Ranking & Comparison Metrics
            required_threshold = dash_data.subjects[0].required_threshold if dash_data.subjects else 75.0
            sorted_by_pct = sorted(subjects_list, key=lambda s: s["percentage"])
            lowest_sub = sorted_by_pct[0] if sorted_by_pct else None
            highest_sub = sorted_by_pct[-1] if sorted_by_pct else None
            deficits = [s for s in sorted_by_pct if s.get("percentage", 100) < required_threshold]

            # 2. Entity & Subject Identification
            matched_subject = None
            for s in subjects_list:
                s_name = s["subject_name"].lower()
                s_code = s["subject_code"].lower()
                if s_code in q_lower or s_name in q_lower or any(word in q_lower for word in s_name.split() if len(word) > 3):
                    matched_subject = s
                    break

            # Fallback to history for pronoun / relative reference ("that subject", "it", "lowest")
            if not matched_subject and history:
                for h in reversed(history):
                    h_content = h.get("content", "").lower()
                    for s in subjects_list:
                        if s["subject_code"].lower() in h_content or s["subject_name"].lower() in h_content:
                            matched_subject = s
                            break
                    if matched_subject:
                        break

            # If still not matched but user asks about lowest / worst, use lowest_sub
            if not matched_subject and any(k in q_lower for k in ["lowest", "worst", "most urgent", "biggest concern", "concern"]):
                matched_subject = lowest_sub

            # 3. Deterministic What-If Simulation (Single and Multi-Subject)
            simulation_result = None
            multi_simulations = []

            # Check for multi-subject simulation query
            for s in subjects_list:
                s_code = s["subject_code"].lower()
                s_name = s["subject_name"].lower()
                if s_code in q_lower or s_name in q_lower:
                    att_cnt = 0
                    miss_cnt = 0
                    att_pattern = rf"attend\s+(?:the\s+next\s+)?(\d+)\s+classes?(?:\s+of|\s+in)?\s+[^,\.]*?(?:{re.escape(s_code)}|{re.escape(s_name)})"
                    miss_pattern = rf"miss\s+(?:the\s+next\s+)?(\d+)\s+classes?(?:\s+of|\s+in)?\s+[^,\.]*?(?:{re.escape(s_code)}|{re.escape(s_name)})"
                    att_m = re.search(att_pattern, q_lower)
                    miss_m = re.search(miss_pattern, q_lower)
                    if att_m:
                        att_cnt = int(att_m.group(1))
                    if miss_m:
                        miss_cnt = int(miss_m.group(1))
                    if att_cnt == 0 and miss_cnt == 0:
                        rev_att = rf"(?:{re.escape(s_code)}|{re.escape(s_name)})[^,\.]*?attend\s+(?:the\s+next\s+)?(\d+)"
                        rev_miss = rf"(?:{re.escape(s_code)}|{re.escape(s_name)})[^,\.]*?miss\s+(?:the\s+next\s+)?(\d+)"
                        r_att = re.search(rev_att, q_lower)
                        r_miss = re.search(rev_miss, q_lower)
                        if r_att:
                            att_cnt = int(r_att.group(1))
                        if r_miss:
                            miss_cnt = int(r_miss.group(1))

                    if att_cnt > 0 or miss_cnt > 0:
                        sim = simulate_attendance(
                            current_attended=s["classes_attended"],
                            current_conducted=s["classes_conducted"],
                            future_attended=att_cnt,
                            future_missed=miss_cnt,
                            target_pct=required_threshold
                        )
                        consecutive_afterward = calculate_consecutive_needed(
                            attended=sim["projected_attended"],
                            conducted=sim["projected_conducted"],
                            target_pct=required_threshold
                        )
                        multi_simulations.append({
                            "subject_code": s["subject_code"],
                            "subject_name": s["subject_name"],
                            "current_pct": s["percentage"],
                            "current_attended": s["classes_attended"],
                            "current_conducted": s["classes_conducted"],
                            "future_attended": att_cnt,
                            "future_missed": miss_cnt,
                            "projected_percentage": sim["projected_percentage"],
                            "projected_attended": sim["projected_attended"],
                            "projected_conducted": sim["projected_conducted"],
                            "meets_threshold": sim["meets_threshold"],
                            "projected_risk": sim["projected_risk"],
                            "consecutive_needed_afterward": consecutive_afterward
                        })

            if len(multi_simulations) == 1:
                simulation_result = multi_simulations[0]
            elif not multi_simulations:
                sim_sub = matched_subject or lowest_sub
                if sim_sub:
                    attend_match = re.search(r"attend\s+(?:the\s+next\s+)?(\d+)\s+classes?", q_lower)
                    miss_match = re.search(r"miss\s+(?:the\s+next\s+)?(\d+)\s+classes?", q_lower)
                    att_delta = int(attend_match.group(1)) if attend_match else (3 if "what if i attend" in q_lower else 0)
                    miss_delta = int(miss_match.group(1)) if miss_match else (3 if "what if i miss" in q_lower else 0)

                    if att_delta > 0 or miss_delta > 0:
                        sim_calc = simulate_attendance(
                            current_attended=sim_sub["classes_attended"],
                            current_conducted=sim_sub["classes_conducted"],
                            future_attended=att_delta,
                            future_missed=miss_delta,
                            target_pct=required_threshold
                        )
                        consecutive_afterward = calculate_consecutive_needed(
                            attended=sim_calc["projected_attended"],
                            conducted=sim_calc["projected_conducted"],
                            target_pct=required_threshold
                        )
                        simulation_result = {
                            "subject_name": sim_sub["subject_name"],
                            "subject_code": sim_sub["subject_code"],
                            "current_pct": sim_sub["percentage"],
                            "current_attended": sim_sub["classes_attended"],
                            "current_conducted": sim_sub["classes_conducted"],
                            "future_attended": att_delta,
                            "future_missed": miss_delta,
                            "projected_percentage": sim_calc["projected_percentage"],
                            "projected_attended": sim_calc["projected_attended"],
                            "projected_conducted": sim_calc["projected_conducted"],
                            "meets_threshold": sim_calc["meets_threshold"],
                            "projected_risk": sim_calc["projected_risk"],
                            "consecutive_needed_afterward": consecutive_afterward
                        }

            self._calc_latency_ms = max(1, int((time.time() - t_calc_start) * 1000))

            authorized_context = {
                "student_id": student.id,
                "full_name": full_name,
                "roll_number": student.roll_number,
                "department": student.department,
                "overall_percentage": dash_data.overall_percentage,
                "required_threshold": required_threshold,
                "total_subjects": len(subjects_list),
                "active_alerts_count": dash_data.active_alerts_count,
                "subjects": subjects_list,
                "lowest_subject": lowest_sub,
                "highest_subject": highest_sub,
                "deficits_count": len(deficits),
                "deficits_list": deficits,
                "matched_subject": matched_subject,
                "simulation": simulation_result,
                "multi_simulations": multi_simulations if len(multi_simulations) > 1 else None
            }

        elif role in ["faculty", "admin"]:
            t_db_start = time.time()
            faculty_id = 1
            if role == "faculty":
                faculty = self.db.query(Faculty).filter(Faculty.user_id == self.current_user.id).first()
                if faculty:
                    faculty_id = faculty.id

            overview = get_faculty_class_overview(self.db, faculty_id)
            self._db_latency_ms = max(1, int((time.time() - t_db_start) * 1000))
            self._calc_latency_ms = 1
            authorized_context = overview

        return authorized_context, self._db_latency_ms, self._calc_latency_ms

    def process_query(self, message: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        role = self.current_user.role.lower()
        full_name = self.current_user.full_name

        authorized_context, db_ms, calc_ms = self.build_authorized_context(message, history)
        if "error" in authorized_context:
            return {
                "reply": authorized_context["reply"],
                "suggested_actions": [],
                "is_mock_ai": not llm_provider.is_live_llm(),
                "telemetry": None
            }

        # Generate response using LLM or dynamic deterministic reasoning engine
        result = llm_provider.generate_assistant_chat_reply(
            user_role=role,
            user_name=full_name,
            query=message,
            authorized_context=authorized_context,
            history=history,
            pipeline_timings={"db_ms": db_ms, "calc_ms": calc_ms}
        )

        return {
            "reply": result["reply"],
            "suggested_actions": result.get("suggested_actions", []),
            "data_snapshot": {
                "role": role,
                "subjects_analyzed": len(authorized_context.get("subjects", [])),
                "timestamp": authorized_context.get("timestamp")
            },
            "is_mock_ai": result.get("is_mock_ai", not llm_provider.is_live_llm()),
            "telemetry": result.get("telemetry")
        }

    def stream_query(self, message: str, history: Optional[List[Dict[str, str]]] = None) -> Generator[Dict[str, Any], None, None]:
        """
        Server-Sent Events streaming generator yielding lifecycle progress stages and text chunks.
        """
        role = self.current_user.role.lower()
        full_name = self.current_user.full_name

        yield {
            "type": "stage",
            "stage": "FETCHING_DATA",
            "message": "Retrieving authorized academic attendance records..."
        }

        authorized_context, db_ms, calc_ms = self.build_authorized_context(message, history)
        if "error" in authorized_context:
            yield {
                "type": "done",
                "reply": authorized_context["reply"],
                "suggested_actions": [],
                "telemetry": None
            }
            return

        yield {
            "type": "stage",
            "stage": "CALCULATING_RECOVERY",
            "message": "Computing deterministic attendance benchmarks & recovery metrics..."
        }

        # Stream chunks from LLM provider
        for event in llm_provider.stream_assistant_chat_reply(
            user_role=role,
            user_name=full_name,
            query=message,
            authorized_context=authorized_context,
            history=history,
            pipeline_timings={"db_ms": db_ms, "calc_ms": calc_ms}
        ):
            yield event
