from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict

class AttendanceRecordCreate(BaseModel):
    student_id: int
    subject_id: int
    date: date
    status: str = Field(..., description="PRESENT or ABSENT")
    notes: Optional[str] = None

class AttendanceRecordUpdate(BaseModel):
    status: str = Field(..., description="PRESENT or ABSENT")
    notes: Optional[str] = None
    reason: Optional[str] = Field("Manual faculty attendance status correction", description="Mandatory audit trail reason for correction")

class AttendanceCorrectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    attendance_id: int
    corrected_by_user_id: Optional[int] = None
    corrected_by_name: Optional[str] = None
    previous_status: str
    new_status: str
    reason: str
    corrected_at: datetime

class AttendanceRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    student_name: Optional[str] = None
    roll_number: Optional[str] = None
    subject_id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    date: date
    status: str
    notes: Optional[str] = None
    created_at: datetime
    corrections: Optional[List[AttendanceCorrectionResponse]] = []

class WhatIfRequest(BaseModel):
    student_id: Optional[int] = None
    subject_id: int
    classes_to_attend: int = 0
    classes_to_miss: int = 0

class WhatIfResponse(BaseModel):
    student_id: int
    student_name: str
    subject_id: int
    subject_code: str
    subject_name: str
    current_attended: int
    current_conducted: int
    current_percentage: float
    current_risk_level: str
    simulated_classes_attended: int
    simulated_classes_conducted: int
    projected_percentage: float
    projected_risk_level: str
    percentage_change: float
    required_threshold: float
    is_above_threshold: bool
    status_summary: str
    ai_explanation: str

class CSVImportResult(BaseModel):
    records_processed: int
    successful_records: int
    failed_records: int
    duplicate_records: int
    errors: List[str] = []

