"""行程 API 测试"""
from fastapi.testclient import TestClient


class TestItineraryList:
    def test_empty_list(self, client: TestClient, auth_headers: dict):
        resp = client.get("/api/itinerary", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_unauthenticated(self, client: TestClient):
        resp = client.get("/api/itinerary")
        assert resp.status_code in (401, 403)