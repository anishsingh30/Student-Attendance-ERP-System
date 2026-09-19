from typing import Optional, List
from pydantic import BaseModel, EmailStr

class AddStudentRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    roll_number: str
    department: str = "Computer Science"
    semester: int = 5
    section: str = "A"

class AddFacultyRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    employee_id: str
    department: str = "Computer Science"
    designation: str = "Assistant Professor"
    assigned_subject_ids: Optional[List[int]] = None

class UserStatusUpdateRequest(BaseModel):
    is_active: bool

class ResetPasswordRequest(BaseModel):
    new_password: str
    require_change_on_next_login: bool = True

class SubjectCreateRequest(BaseModel):
    code: str
    name: str
    department: str
    semester: int = 5
    total_classes_scheduled: int = 50
    credits: Optional[int] = 3

class SubjectUpdateRequest(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    total_classes_scheduled: Optional[int] = None
    credits: Optional[int] = None
    is_active: Optional[bool] = None

class SubjectResponse(BaseModel):
    id: int
    code: str
    name: str
    department: str
    semester: int
    total_classes_scheduled: int
    is_active: bool = True
    credits: Optional[int] = 3
    faculty_count: Optional[int] = 0
    attendance_records_count: Optional[int] = 0
    alerts_count: Optional[int] = 0
