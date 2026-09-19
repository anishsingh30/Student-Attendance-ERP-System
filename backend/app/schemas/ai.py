from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    context_student_id: Optional[int] = None
    context_subject_id: Optional[int] = None

class ChatResponse(BaseModel):
    reply: str
    suggested_actions: Optional[List[str]] = []
    data_snapshot: Optional[Dict[str, Any]] = None
    is_mock_ai: bool = False
    telemetry: Optional[Dict[str, Any]] = None
