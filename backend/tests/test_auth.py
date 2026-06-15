"""认证模块测试"""
import pytest
from fastapi.testclient import TestClient


class TestRegister:
    def test_register_success(self, client: TestClient):
        resp = client.post(
            "/api/auth/register",
            json={"username": "alice", "email": "alice@test.com", "password": "123456"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["username"] == "alice"
        assert data["email"] == "alice@test.com"
        assert "password" not in data

    def test_register_duplicate_email(self, client: TestClient):
        payload = {"username": "bob", "email": "bob@test.com", "password": "123456"}
        client.post("/api/auth/register", json=payload)
        resp = client.post("/api/auth/register", json=payload)
        assert resp.status_code == 400

    def test_register_short_password(self, client: TestClient):
        resp = client.post(
            "/api/auth/register",
            json={"username": "cat", "email": "cat@test.com", "password": "123"},
        )
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client: TestClient):
        client.post(
            "/api/auth/register",
            json={"username": "dave", "email": "dave@test.com", "password": "123456"},
        )
        resp = client.post(
            "/api/auth/login", json={"email": "dave@test.com", "password": "123456"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client: TestClient):
        client.post(
            "/api/auth/register",
            json={"username": "eve", "email": "eve@test.com", "password": "123456"},
        )
        resp = client.post(
            "/api/auth/login", json={"email": "eve@test.com", "password": "wrong"}
        )
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client: TestClient):
        resp = client.post(
            "/api/auth/login", json={"email": "nobody@test.com", "password": "123456"}
        )
        assert resp.status_code == 401


class TestMe:
    def test_get_me_authenticated(self, client: TestClient, auth_headers: dict):
        resp = client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "tester"
        assert data["email"] == "test@test.com"

    def test_get_me_no_token(self, client: TestClient):
        resp = client.get("/api/auth/me")
        assert resp.status_code in (401, 403)