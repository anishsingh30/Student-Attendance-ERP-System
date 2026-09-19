from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(Integer, primary_key=True, index=True)
    triggered_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    trigger_type = Column(String(50), nullable=False, default="MANUAL")  # MANUAL, SCHEDULED, API
    status = Column(String(50), nullable=False, default="RUNNING")  # RUNNING, COMPLETED, FAILED, PARTIAL, CANCELLED
    current_stage = Column(String(100), nullable=False, default="INITIALIZING")
    start_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    end_time = Column(DateTime, nullable=True)
    students_analyzed = Column(Integer, default=0)
    at_risk_found = Column(Integer, default=0)
    alerts_created = Column(Integer, default=0)
    notifications_sent = Column(Integer, default=0)
    tool_executions = Column(Integer, default=0)
    errors = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)

    # Relationships
    logs = relationship("AgentLog", back_populates="run", cascade="all, delete-orphan", order_by="AgentLog.step_number")

class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("agent_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False)
    step_name = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="INFO")  # STARTED, COMPLETED, FAILED, INFO
    log_message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    run = relationship("AgentRun", back_populates="logs")

