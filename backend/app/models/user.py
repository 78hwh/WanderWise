"""用户模型"""
from datetime import datetime, timezone, timedelta

from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

TZ = timezone(timedelta(hours=8))


def now_beijing() -> datetime:
    return datetime.now(TZ).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_beijing)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=now_beijing, onupdate=now_beijing
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username!r})>"