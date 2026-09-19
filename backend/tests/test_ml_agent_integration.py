import pytest
from app.core.database import SessionLocal
from app.agents.attendance_agent import AttendanceMonitoringAgent
from app.models.agent import AgentRun, AgentLog
from app.models.alert import Alert
from app.models.notification import Notification
from app.ml.predictor import ml_predictor

def test_ml_agent_integration_and_branching(monkeypatch):
    """Verify that the autonomous agent actually executes ML inference and dynamically branches decisions."""
    from app.agents.llm_provider import llm_provider
    monkeypatch.setattr(llm_provider, "provider", "mock")
    db = SessionLocal()
    try:
        agent = AttendanceMonitoringAgent(db=db, triggered_by_user_id=None, trigger_type="MANUAL")
        result = agent.run()

        assert result["status"] == "COMPLETED"
        assert result["students_analyzed"] > 0
        assert "run_id" in result

        # Verify ML risk inference tool execution was recorded in agent logs
        logs = db.query(AgentLog).filter(AgentLog.run_id == result["run_id"]).all()
        log_messages = [l.log_message for l in logs]

        has_ml_stage = any("ML_RISK_ANALYSIS" in l.step_name for l in logs)
        assert has_ml_stage, "Agent did not transition through ML_RISK_ANALYSIS stage"

        has_branching = any("Decision Matrix" in m for m in log_messages)
        assert has_branching, "Agent did not execute dynamic decision branching matrix"

        # Verify alerts created have valid risk levels
        if result["alerts_created"] > 0:
            active_alerts = db.query(Alert).filter(Alert.is_resolved == False).all()
            for a in active_alerts:
                assert a.risk_level in ["RED", "ORANGE", "YELLOW", "GREEN"]
                assert a.classes_conducted > 0

    finally:
        db.close()
