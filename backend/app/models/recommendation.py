"""推荐记录模型 —— 存储推荐历史和用户反馈"""
from datetime import datetime

from sqlalchemy import String, DateTime, Integer, Float, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import now_beijing


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    destination: Mapped[str] = mapped_column(String(200), nullable=False)
    reason: Mapped[str] = mapped_column(Text, default="")
    tags_json: Mapped[str] = mapped_column(Text, default="[]")
    score: Mapped[float] = mapped_column(Float, default=0.0)
    matched_preferences: Mapped[str] = mapped_column(Text, default="")
    weather_json: Mapped[str] = mapped_column(Text, default="{}")
    feedback: Mapped[str | None] = mapped_column(String(20), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_beijing)

    user = relationship("app.models.user.User")

    def __repr__(self) -> str:
        return f"<Recommendation(id={self.id}, destination={self.destination!r})>"