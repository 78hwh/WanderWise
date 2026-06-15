"""行程相关 Pydantic 模型"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ---- 行程内容子结构 ----

class Activity(BaseModel):
    time: str = Field("", description="时间段，如 09:00-11:00")
    name: str = Field(..., description="活动名称")
    description: str = Field("", description="活动简介")
    tips: str = Field("", description="小贴士")


class Meal(BaseModel):
    type: str = Field("", description="早餐/午餐/晚餐")
    name: str = Field("", description="餐厅或食物名称")
    description: str = Field("", description="推荐理由")


class DayPlan(BaseModel):
    day: int = Field(..., description="第几天")
    title: str = Field("", description="当日主题，如「古城漫步」")
    activities: list[Activity] = Field(default_factory=list)
    meals: list[Meal] = Field(default_factory=list)
    accommodation: str = Field("", description="推荐住宿")
    notes: str = Field("", description="当日备注")


class ItineraryContent(BaseModel):
    """AI 生成行程的 JSON 结构"""
    overview: str = Field("", description="行程概览（2-3句话）")
    budget_estimate: str = Field("", description="预算估算说明")
    days: list[DayPlan] = Field(default_factory=list)
    general_tips: list[str] = Field(default_factory=list, description="通用贴士")


# ---- API 请求/响应 ----

class GenerateItineraryRequest(BaseModel):
    """生成行程请求"""
    conversation_id: Optional[int] = Field(None, description="关联的对话 ID")
    destination: str = Field(..., min_length=1, max_length=200, description="目的地")
    days: int = Field(3, ge=1, le=30, description="旅行天数")
    budget: str = Field("中等", description="预算水平：经济/中等/豪华")
    extra_requirements: str = Field("", description="额外需求文本")


class ItineraryListItem(BaseModel):
    """行程列表项"""
    id: int
    title: str
    destination: str
    days: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ItineraryDetail(BaseModel):
    """行程详情"""
    id: int
    title: str
    destination: str
    days: int
    content: ItineraryContent
    status: str
    created_at: datetime
    updated_at: datetime