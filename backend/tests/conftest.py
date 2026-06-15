"""pytest 配置 — 测试数据库 + 客户端"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# 内存数据库，测试间完全隔离
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    """每个测试前重建表"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    """带数据库覆盖的测试客户端"""

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """注册用户 → 登录 → 返回带 token 的 headers"""
    client.post(
        "/api/auth/register",
        json={"username": "tester", "email": "test@test.com", "password": "123456"},
    )
    resp = client.post(
        "/api/auth/login", json={"email": "test@test.com", "password": "123456"}
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}