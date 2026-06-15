"""聊天 + 记忆 API 测试"""
from fastapi.testclient import TestClient


class TestChatHistory:
    def test_empty_history(self, client: TestClient, auth_headers: dict):
        resp = client.get("/api/chat/history", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []


class TestMemories:
    def test_get_memories_empty(self, client: TestClient, auth_headers: dict):
        resp = client.get("/api/chat/memories", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_clear_memories(self, client: TestClient, auth_headers: dict):
        resp = client.delete("/api/chat/memories/clear", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == {"ok": True}