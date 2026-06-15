"""聊天相关 Pydantic 模型"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """单条消息"""
    role: str = Field(..., description="user 或 assistant")
    content: str = Field(..., description="消息内容")


class SendMessageRequest(BaseModel):
    """发送消息请求"""
    conversation_id: Optional[int] = Field(None, description="会话ID，新建会话可不传")
    message: str = Field(..., min_length=1, max_length=5000, description="用户消息")
    use_reasoner: bool = Field(False, description="是否使用推理模型")


class ConversationResponse(BaseModel):
    """会话摘要"""
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetail(BaseModel):
    """会话详情（含消息列表）"""
    id: int
    title: str
    messages: list[ChatMessage]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MemoryResponse(BaseModel):
    """用户偏好记忆"""
    id: int
    category: str
    key: str
    value: str
    confidence: float
    created_at: datetime

    model_config = {"from_attributes": True}