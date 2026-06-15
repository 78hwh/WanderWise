"""数据库引擎与会话管理 — 兼容 SQLite（开发）与 PostgreSQL（生产）"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

# PostgreSQL 需要不同的连接参数
_db_url = settings.DATABASE_URL
if _db_url.startswith("sqlite"):
    engine = create_engine(
        _db_url,
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    # PostgreSQL / 其他数据库
    engine = create_engine(_db_url, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """每个请求一个数据库会话，用完自动关闭"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
