from pydantic import BaseModel, EmailStr, field_validator
import re

class RegisterRequest(BaseModel):
    username: str
    name: str
    email: EmailStr
    mobile: str
    password: str
    confirm_password: str
    referral_id: str  # Required: referrer's username

    @field_validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers and underscore')
        return v

    @field_validator('mobile')
    def validate_mobile(cls, v):
        # Accept international format with country code
        if not re.match(r'^\+?[1-9]\d{1,14}$', v):
            raise ValueError('Mobile number must include country code (e.g., +1234567890)')
        return v

    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v
    
    @field_validator('referral_id')
    def validate_referral_id(cls, v):
        if not v or not v.strip():
            raise ValueError('Referral username is required')
        return v.strip()

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    token: str = None
    user: dict = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    name: str
    mobile: str
    referral_code: str
    referral_link: str
    balance: float
