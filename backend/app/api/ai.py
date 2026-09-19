import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rate_limiter import rate_limit
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.ai import ChatRequest, ChatResponse
from app.agents.assistant_agent import AttendanceAIAssistant
from app.agents.llm_provider import llm_provider

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

@router.get("/status")
def get_ai_status():
    return llm_provider.get_status_info()

@router.get("/health")
def get_ai_health():
    return llm_provider.check_health()

@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _rate_check: bool = Depends(rate_limit(max_requests=30, window_seconds=60, endpoint_tag="ai_chat"))
):
    """
    Role-aware AI chatbot assistant with strict input sanitization,
    latency optimization, prompt injection defense, and data privacy isolation.
    """
    assistant = AttendanceAIAssistant(db=db, current_user=current_user)
    history_dicts = [h.model_dump() for h in req.history] if req.history else None
    result = assistant.process_query(message=req.message, history=history_dicts)
    return ChatResponse(
        reply=result["reply"],
        suggested_actions=result.get("suggested_actions", []),
        data_snapshot=result.get("data_snapshot"),
        is_mock_ai=result.get("is_mock_ai", False),
        telemetry=result.get("telemetry")
    )

@router.post("/chat/stream")
def stream_chat_with_assistant(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _rate_check: bool = Depends(rate_limit(max_requests=30, window_seconds=60, endpoint_tag="ai_chat_stream"))
):
    """
    Real-time Server-Sent Events (SSE) streaming endpoint for the AI Assistant.
    Yields staged execution progress and live text tokens.
    """
    assistant = AttendanceAIAssistant(db=db, current_user=current_user)
    history_dicts = [h.model_dump() for h in req.history] if req.history else None

    def event_generator():
        for event in assistant.stream_query(message=req.message, history=history_dicts):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
