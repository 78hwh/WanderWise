"""推荐 API 测试"""
from fastapi.testclient import TestClient


class TestRecommendHistory:
    def test_empty_history(self, client: TestClient, auth_headers: dict):
        resp = client.get("/api/recommend/history", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_unauthenticated(self, client: TestClient):
        resp = client.get("/api/recommend/history")
        assert resp.status_code in (401, 403)