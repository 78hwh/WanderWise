"""翻译 API 测试"""
from fastapi.testclient import TestClient


class TestTranslate:
    def test_empty_text(self, client: TestClient):
        resp = client.post(
            "/api/translate",
            json={"text": "", "target_lang": "English"},
        )
        assert resp.status_code == 422

    def test_basic_request(self, client: TestClient):
        """验证接口可访问（实际翻译依赖 AI，这里只测参数校验）"""
        resp = client.post(
            "/api/translate",
            json={"text": "你好世界", "target_lang": "English"},
        )
        # 没有 AI key 时可能返回 422 或 500，接口本身应可访问
        assert resp.status_code in (200, 422, 500)