"""行程模型 —— 存储 AI 生成的结构化行程规划"""
from datetime import datetime

from sqlalchemy import String, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import now_beijing


class Itinerary(Base):
    __tablename__ = "itineraries"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    conversation_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("conversations.id"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(200), default="未命名行程")
    destination: Mapped[str] = mapped_column(String(200), default="")
    days: Mapped[int] = mapped_column(Integer, default=1)
    content_json: Mapped[str] = mapped_column(Text, default="{}")
    status: Mapped[str] = mapped_column(String(20), default="draft")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_beijing)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=now_beijing, onupdate=now_beijing
    )

    user = relationship("app.models.user.User")

    def __repr__(self) -> str:
        return f"<Itinerary(id={self.id}, title={self.title!r})>"