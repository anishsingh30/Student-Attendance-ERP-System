from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str
    full_name: str
    role: str
    profile_photo_url: Optional[str] = None
    must_change_password: bool = False

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str
    portal_role: Optional[str] = None

class ForceChangePasswordRequest(BaseModel):
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "student"
    roll_number: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = 5
    section: Optional[str] = "A"

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    profile_photo_url: Optional[str] = None
    must_change_password: bool = False
    created_at: datetime
    profile_id: Optional[int] = None
    roll_number: Optional[str] = None
    employee_id: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    access_token: Optional[str] = None


