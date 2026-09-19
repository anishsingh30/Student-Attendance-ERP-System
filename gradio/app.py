import os
import sys
import gradio as gr

# Add backend directory to sys.path so it reuses the exact same database and services
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.core.database import SessionLocal
from app.models.student import Student
from app.models.subject import Subject
from app.models.user import User
from app.services.attendance_service import get_student_dashboard_data, get_student_subject_attendance
from app.agents.attendance_agent import AttendanceMonitoringAgent
from app.services.what_if_service import simulate_attendance_scenario
from app.agents.llm_provider import llm_provider

def view_student_attendance(roll_or_id):
    db = SessionLocal()
    try:
        st = None
        if str(roll_or_id).isdigit():
            st = db.query(Student).filter(Student.id == int(roll_or_id)).first()
        if not st:
            st = db.query(Student).filter(Student.roll_number.ilike(str(roll_or_id).strip())).first()

        if not st:
            return "Student not found. Try CS2022-001 (Rahul Verma), CS2022-002 (Priya Sharma), or CS2022-003 (Amit Kumar)."

        dash = get_student_dashboard_data(db, st.id)
        report = [
            f"### Student Profile: {dash.full_name} ({dash.roll_number})",
            f"**Department**: {dash.department} | **Semester**: {dash.semester}",
            f"**Overall Attendance**: **{dash.overall_percentage}%** [{dash.overall_risk_level}]",
            f"**Subjects Monitored**: {dash.total_subjects} | **Deficit Subjects**: {dash.subjects_below_threshold}",
            "\n| Subject Code | Subject Name | Attended / Total | Percentage | Risk Level | Consecutive Needed |",
            "|---|---|---|---|---|---|"
        ]
        for s in dash.subjects:
            report.append(f"| {s.subject_code} | {s.subject_name} | {s.classes_attended}/{s.classes_conducted} | {s.percentage}% | {s.risk_level} | {s.consecutive_classes_needed} |")

        return "\n".join(report)
    finally:
        db.close()

def run_agent_monitoring():
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.role == "admin").first()
        agent = AttendanceMonitoringAgent(db=db, triggered_by_user_id=admin_user.id if admin_user else 1)
        res = agent.run()
        out = [
            "### Agentic AI Monitoring Cycle Completed Successfully",
            f"• **Status**: {res['status']}",
            f"• **Students Analyzed**: {res['students_analyzed']}",
            f"• **At-Risk Anomalies Detected**: {res['at_risk_found']}",
            f"• **Personalized Alerts Published**: {res['alerts_created']}",
            f"• **In-App Notifications Dispatched**: {res['notifications_sent']}",
            f"\n**Execution Summary**:\n{res['summary']}"
        ]
        return "\n".join(out)
    finally:
        db.close()

def simulate_what_if_gradio(roll_or_id, subject_code, miss_classes, attend_classes):
    db = SessionLocal()
    try:
        st = None
        if str(roll_or_id).isdigit():
            st = db.query(Student).filter(Student.id == int(roll_or_id)).first()
        if not st:
            st = db.query(Student).filter(Student.roll_number.ilike(str(roll_or_id).strip())).first()

        sub = db.query(Subject).filter(Subject.code.ilike(subject_code.strip())).first()
        if not st or not sub:
            return "Please provide valid Student Roll Number and Subject Code (e.g. CS501)."

        sim = simulate_attendance_scenario(
            db=db,
            student_id=st.id,
            subject_id=sub.id,
            classes_to_attend=int(attend_classes),
            classes_to_miss=int(miss_classes)
        )
        return (
            f"### Deterministic Simulation Results for {sim.student_name} ({sim.subject_code})\n\n"
            f"• **Current Attendance**: {sim.current_percentage}% ({sim.current_attended}/{sim.current_conducted} classes)\n"
            f"• **Projected Attendance**: **{sim.projected_percentage}%** [{sim.projected_risk_level}]\n"
            f"• **Net Change**: {sim.percentage_change}%\n"
            f"• **Threshold Compliance**: {'PASS (Above 75%)' if sim.is_above_threshold else 'FAIL (Below 75%)'}\n\n"
            f"**AI Explanation & Strategic Guidance**:\n{sim.ai_explanation}"
        )
    finally:
        db.close()

from app.ml.predictor import ml_predictor

def view_ml_telemetry():
    db = SessionLocal()
    try:
        metrics = ml_predictor.get_metrics(db)
        ev = metrics.get("metrics", {})
        lines = [
            f"### Verified Machine Learning Risk Model Telemetry",
            f"• **Algorithm**: `{metrics.get('algorithm', 'RandomForestClassifier')}`",
            f"• **Model Version**: `{metrics.get('model_version', 'v1.2.0-rf')}`",
            f"• **Evaluated At**: `{metrics.get('evaluated_at', 'Active')}`",
            f"\n**Empirical Test Set Metrics**:",
            f"• **Accuracy**: **{round(ev.get('accuracy', 0) * 100, 2)}%**",
            f"• **Precision**: **{round(ev.get('precision', 0) * 100, 2)}%**",
            f"• **Recall**: **{round(ev.get('recall', 0) * 100, 2)}%**",
            f"• **F1-Score**: **{round(ev.get('f1_score', 0) * 100, 2)}%**",
            f"\n**Gini Feature Importances**:"
        ]
        for f, imp in sorted(metrics.get("feature_importances", {}).items(), key=lambda x: x[1], reverse=True):
            lines.append(f"• `{f}`: {round(imp * 100, 2)}%")
        return "\n".join(lines)
    finally:
        db.close()

def build_gradio_demo():
    status = llm_provider.get_status_info()
    theme = gr.themes.Soft(
        primary_hue="indigo",
        secondary_hue="slate"
    )

    with gr.Blocks(title="Automated Student Attendance Alert System - AI Agent Demo", theme=theme) as demo:
        gr.Markdown(
            f"""
            # Automated Student Attendance Alert System
            ### Agentic AI Monitoring & Risk Prediction Platform
            **Active AI Engine**: `{status['display_badge']}` ({status['description']})
            """
        )

        with gr.Tab("Student Attendance Inspector"):
            gr.Markdown("Inspect real-time deterministic attendance records, risk levels, and consecutive recovery classes needed.")
            with gr.Row():
                st_input = gr.Textbox(label="Enter Student Roll Number or ID", value="CS2022-001", placeholder="CS2022-001")
                btn_inspect = gr.Button("Inspect Attendance", variant="primary")
            out_inspect = gr.Markdown()
            btn_inspect.click(view_student_attendance, inputs=[st_input], outputs=[out_inspect])

        with gr.Tab("What-If Attendance Simulator"):
            gr.Markdown("Test hypothetical class attendance scenarios with deterministic math calculation followed by AI reasoning.")
            with gr.Row():
                sim_st = gr.Textbox(label="Student Roll No", value="CS2022-001")
                sim_sub = gr.Textbox(label="Subject Code", value="CS501")
                sim_miss = gr.Slider(minimum=0, maximum=10, step=1, value=2, label="Classes to Miss")
                sim_attend = gr.Slider(minimum=0, maximum=10, step=1, value=0, label="Classes to Attend")
            btn_sim = gr.Button("Run Simulation", variant="primary")
            out_sim = gr.Markdown()
            btn_sim.click(simulate_what_if_gradio, inputs=[sim_st, sim_sub, sim_miss, sim_attend], outputs=[out_sim])

        with gr.Tab("Autonomous Agent Execution"):
            gr.Markdown("Trigger the 10-stage autonomous Attendance Monitoring Agent workflow across all monitored students.")
            btn_agent = gr.Button("Run Autonomous Attendance Agent", variant="primary")
            out_agent = gr.Markdown()
            btn_agent.click(run_agent_monitoring, outputs=[out_agent])

        with gr.Tab("ML Risk Telemetry & Metrics"):
            gr.Markdown("Inspect authentic Scikit-Learn evaluation metrics, confusion matrix parameters, and feature importances.")
            btn_ml = gr.Button("Load ML Telemetry", variant="primary")
            out_ml = gr.Markdown()
            btn_ml.click(view_ml_telemetry, outputs=[out_ml])

    return demo

if __name__ == "__main__":
    app = build_gradio_demo()
    app.launch(server_name="0.0.0.0", server_port=7860, share=False)
