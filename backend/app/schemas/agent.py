from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class AgentLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    run_id: int
    step_number: int
    step_name: str
    status: str
    log_message: str
    timestamp: datetime

class AgentRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    triggered_by: Optional[int] = None
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    students_analyzed: int
    at_risk_found: int
    alerts_created: int
    notifications_sent: int
    summary: Optional[str] = None
    logs: Optional[List[AgentLogResponse]] = []

class AgentTriggerRequest(BaseModel):
    department: Optional[str] = None
    semester: Optional[int] = None
    threshold_override: Optional[float] = None

