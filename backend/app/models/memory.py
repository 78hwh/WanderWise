"""用户记忆模型 —— 存储从对话中提取的旅行偏好"""
from datetime import datetime

from sqlalchemy import String, DateTime, Integer, ForeignKey, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import now_beijing


class UserMemory(Base):
    __tablename__ = "user_memories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    key: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.5)
    source_conversation_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("conversations.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_beijing)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=now_beijing, onupdate=now_beijing
    )

    user = relationship("app.models.user.User")

    def __repr__(self) -> str:
        return (
            f"<UserMemory(id={self.id}, user_id={self.user_id}, "
            f"category={self.category!r}, key={self.key!r})>"
        )
