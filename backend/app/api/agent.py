from typing import List, Dict, Any, Optional, Union
import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User
from app.models.agent import AgentRun, AgentLog
from app.schemas.agent import AgentRunResponse, AgentLogResponse, AgentTriggerRequest
from app.agents.attendance_agent import AttendanceMonitoringAgent
from app.agents.llm_provider import llm_provider

router = APIRouter(prefix="/agent", tags=["Agent Operations"])

@router.get("/status")
def get_agent_engine_status():
    """
    Returns live vs mock AI engine operational status and active LLM configuration.
    """
    return llm_provider.get_status_info()

@router.post("/analyze")
@router.post("/run")
def trigger_agent_analysis(
    req: AgentTriggerRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    """
    Triggers autonomous agentic attendance monitoring cycle.
    """
    dept = req.department if req else None
    sem = req.semester if req else None
    override = req.threshold_override if req else None

    agent = AttendanceMonitoringAgent(db=db, triggered_by_user_id=current_user.id)
    result = agent.run(department=dept, semester=sem, threshold_override=override)
    return result

@router.get("/runs", response_model=Union[List[AgentRunResponse], Dict[str, Any]])
def get_agent_runs(
    limit: int = Query(20, ge=1, le=100),
    page: Optional[int] = Query(None, ge=1),
    page_size: Optional[int] = Query(None, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    if page is not None:
        total = db.query(AgentRun).count()
        p = page
        ps = page_size or 20
        runs = db.query(AgentRun).order_by(AgentRun.start_time.desc()).offset((p - 1) * ps).limit(ps).all()
        total_pages = max(1, math.ceil(total / ps))
        return {
            "items": [AgentRunResponse.model_validate(r).model_dump() for r in runs],
            "total": total,
            "page": p,
            "page_size": ps,
            "total_pages": total_pages
        }

    runs = db.query(AgentRun).order_by(AgentRun.start_time.desc()).limit(limit).all()
    return runs

@router.get("/runs/{run_id}", response_model=AgentRunResponse)
def get_agent_run_detail(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")
    return run

@router.get("/runs/{run_id}/logs", response_model=List[AgentLogResponse])
def get_agent_run_logs(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["faculty", "admin"]))
):
    logs = db.query(AgentLog).filter(AgentLog.run_id == run_id).order_by(AgentLog.step_number.asc()).all()
    return logs
