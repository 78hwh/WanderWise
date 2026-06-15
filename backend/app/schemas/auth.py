"""认证相关 Pydantic 模型"""
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr = Field(...)
    password: str = Field(..., min_length=6, max_length=100)


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(...)
    password: str = Field(...)


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse