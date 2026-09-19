from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class ThresholdResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    green_min: float
    yellow_min: float
    orange_min: float
    red_max: float
    is_active: bool
    updated_at: datetime

class ThresholdUpdateRequest(BaseModel):
    green_min: float = Field(..., ge=0, le=100)
    yellow_min: float = Field(..., ge=0, le=100)
    orange_min: float = Field(..., ge=0, le=100)
    red_max: float = Field(..., ge=0, le=100)

