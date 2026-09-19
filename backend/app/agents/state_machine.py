from enum import Enum
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.agent import AgentRun, AgentLog

class AgentStage(str, Enum):
    INITIALIZING = "INITIALIZING"
    FETCHING_DATA = "FETCHING_DATA"
    CALCULATING = "CALCULATING"
    EVALUATING_THRESHOLDS = "EVALUATING_THRESHOLDS"
    ML_RISK_ANALYSIS = "ML_RISK_ANALYSIS"
    IDENTIFYING_RISK = "IDENTIFYING_RISK"
    DECISION_BRANCHING = "DECISION_BRANCHING"
    CALCULATING_RECOVERY = "CALCULATING_RECOVERY"
    GENERATING_EXPLANATION = "GENERATING_EXPLANATION"
    CREATING_ALERT = "CREATING_ALERT"
    DISPATCHING_NOTIFICATION = "DISPATCHING_NOTIFICATION"
    AUTO_RESOLVING = "AUTO_RESOLVING"
    AUDITING = "AUDITING"
    COMPLETED = "COMPLETED"

class AgentStatus(str, Enum):
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class AgentStateMachine:
    """
    Explicit, auditable state machine for the Attendance Monitoring Agent.
    Manages deterministic transitions, tool call telemetry, and database persistence.
    """

    def __init__(self, db: Session, agent_run: AgentRun):
        self.db = db
        self.run = agent_run
        self.current_stage = AgentStage(agent_run.current_stage) if agent_run.current_stage in [e.value for e in AgentStage] else AgentStage.INITIALIZING
        self._step_counter = 0

    @classmethod
    def create_run(
        cls, 
        db: Session, 
        triggered_by: Optional[int] = None, 
        trigger_type: str = "MANUAL"
    ) -> "AgentStateMachine":
        run = AgentRun(
            triggered_by=triggered_by,
            trigger_type=trigger_type,
            status=AgentStatus.RUNNING.value,
            current_stage=AgentStage.INITIALIZING.value,
            start_time=datetime.now(timezone.utc),
            students_analyzed=0,
            at_risk_found=0,
            alerts_created=0,
            notifications_sent=0,
            tool_executions=0
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        sm = cls(db, run)
        sm.log_step(AgentStage.INITIALIZING, "Agent run session initialized and resources allocated.", "COMPLETED")
        return sm

    def transition_to(self, new_stage: AgentStage, message: str, status: str = "IN_PROGRESS"):
        self.current_stage = new_stage
        self.run.current_stage = new_stage.value
        self.db.commit()
        self.log_step(new_stage, message, status)

    def log_step(self, stage: AgentStage, message: str, status: str = "INFO"):
        self._step_counter += 1
        log_entry = AgentLog(
            run_id=self.run.id,
            step_number=self._step_counter,
            step_name=stage.value,
            status=status,
            log_message=message,
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(log_entry)
        self.db.commit()

    def record_tool_call(self, tool_name: str, args_summary: str, result_summary: str):
        self.run.tool_executions = (self.run.tool_executions or 0) + 1
        self.db.commit()
        self.log_step(
            self.current_stage,
            f"Tool Execution [{tool_name}]: Args({args_summary}) -> Result({result_summary})",
            "TOOL_CALL"
        )

    def fail(self, error_message: str):
        self.run.status = AgentStatus.FAILED.value
        self.run.end_time = datetime.now(timezone.utc)
        self.run.errors = error_message
        self.run.summary = f"Agent failed at stage {self.current_stage.value}: {error_message}"
        self.db.commit()
        self.log_step(self.current_stage, f"Execution failed: {error_message}", "FAILED")

    def cancel(self, reason: str = "User cancelled execution"):
        self.run.status = AgentStatus.CANCELLED.value
        self.run.end_time = datetime.now(timezone.utc)
        self.run.errors = reason
        self.run.summary = f"Agent cancelled at stage {self.current_stage.value}: {reason}"
        self.db.commit()
        self.log_step(self.current_stage, f"Execution cancelled: {reason}", "CANCELLED")

    def complete(self, summary: str, partial: bool = False):
        self.current_stage = AgentStage.COMPLETED
        self.run.current_stage = AgentStage.COMPLETED.value
        self.run.status = AgentStatus.PARTIAL.value if partial else AgentStatus.COMPLETED.value
        self.run.end_time = datetime.now(timezone.utc)
        self.run.summary = summary
        self.db.commit()
        self.log_step(AgentStage.COMPLETED, summary, "COMPLETED")

