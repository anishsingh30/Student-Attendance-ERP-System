import pytest
from app.core.database import SessionLocal
from app.agents.state_machine import AgentStateMachine, AgentStage, AgentStatus
from app.agents.attendance_agent import AttendanceMonitoringAgent
from app.models.agent import AgentRun

def test_state_machine_transitions():
    """Verify explicit 10-stage state machine transitions, logging, and database updates."""
    db = SessionLocal()
    try:
        sm = AgentStateMachine.create_run(db, triggered_by=None, trigger_type="TEST")
        assert sm.current_stage == AgentStage.INITIALIZING
        assert sm.run.status == AgentStatus.RUNNING.value

        # Transition to FETCHING_DATA
        sm.transition_to(AgentStage.FETCHING_DATA, "Fetching all enrolled student records")
        assert sm.current_stage == AgentStage.FETCHING_DATA
        assert sm.run.current_stage == AgentStage.FETCHING_DATA.value

        # Transition to CALCULATING
        sm.transition_to(AgentStage.CALCULATING, "Executing deterministic attendance calculations")
        assert sm.current_stage == AgentStage.CALCULATING

        # Record a tool call telemetry event
        sm.record_tool_call("fetch_student_attendance", "student_id=1", "returned 5 records")
        assert sm.run.tool_executions == 1

        # Cancel execution
        sm.cancel(reason="Test abort")
        assert sm.run.status == AgentStatus.CANCELLED.value
    finally:
        db.close()

def test_attendance_monitoring_agent_full_cycle(monkeypatch):
    """Execute complete 10-stage autonomous cycle and verify DB persistence."""
    from app.agents.llm_provider import llm_provider
    monkeypatch.setattr(llm_provider, "provider", "mock")
    db = SessionLocal()
    try:
        agent = AttendanceMonitoringAgent(db=db, triggered_by_user_id=None, trigger_type="MANUAL")
        res = agent.run()

        assert res["status"] in ["COMPLETED", "PARTIAL"]
        assert "run_id" in res
        assert res["students_analyzed"] >= 0
        assert "summary" in res

        # Verify DB run record
        run = db.query(AgentRun).filter(AgentRun.id == res["run_id"]).first()
        assert run is not None
        assert run.status == "COMPLETED"
        assert run.current_stage == "COMPLETED"
        assert run.trigger_type == "MANUAL"
        assert run.students_analyzed == res["students_analyzed"]
    finally:
        db.close()

