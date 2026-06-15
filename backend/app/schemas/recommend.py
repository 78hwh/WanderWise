"""推荐引擎相关 Pydantic 模型"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RecommendRequest(BaseModel):
    """推荐请求"""
    travel_style: str = Field("", description="旅行风格：悠闲/探险/文化/美食/购物")
    budget: str = Field("中等", description="预算水平：经济/中等/豪华")
    season: str = Field("", description="出行季节：春/夏/秋/冬/不限")
    extra: str = Field("", description="额外要求")


class DestinationItem(BaseModel):
    """单个推荐目的地"""
    id: int = Field(0, description="数据库记录ID，用于反馈")
    destination: str = Field(..., description="目的地名称")
    reason: str = Field(..., description="推荐理由")
    tags: list[str] = Field(default_factory=list, description="标签")
    score: float = Field(..., description="匹配度 0-100")
    matched_preferences: str = Field("", description="匹配了哪些偏好")
    weather: str = Field("", description="天气概要")


class RecommendResponse(BaseModel):
    """推荐响应"""
    summary: str = Field("", description="整体推荐说明")
    destinations: list[DestinationItem] = Field(default_factory=list)


class RecommendationHistoryItem(BaseModel):
    """推荐历史列表项"""
    id: int
    destination: str
    reason: str
    tags: list[str]
    score: float
    feedback: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class FeedbackRequest(BaseModel):
    """用户反馈"""
    feedback: str = Field(..., pattern="^(want|not_interested)$", description="want 或 not_interested")