"""翻译服务 — 用 DeepSeek 做多语言翻译"""
import json
import re

from app.services.ai_client import chat_once
from app.services.utils import strip_markdown_code_block

TRANSLATE_SYSTEM_PROMPT = """你是一个专业翻译引擎。只返回严格的 JSON，不要任何其他内容。

返回格式：
{"translated": "译文"}

规则：
- 只返回 JSON，不要 markdown 代码块、不要解释、不要补充
- 如果文本已是目标语言则直接翻译为同义表达
- target_lang 未指定时默认翻译为中文"""


def _extract_json_object(text: str) -> str:
    """从文本中提取第一个 JSON 对象，容忍 AI 偶尔不按格式返回"""
    # 找到第一个 { 到最后一个 } 之间的内容
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    return text


async def translate_text(
    text: str,
    target_lang: str = "中文",
    source_lang: str = "auto",
) -> tuple[str | None, str | None]:
    """翻译文本，返回 (译文, 错误信息)"""
    lang_hint = (
        f"从{source_lang}翻译为{target_lang}"
        if source_lang != "auto"
        else f"翻译为{target_lang}"
    )

    user_prompt = f"{lang_hint}：\n\n{text}"

    try:
        raw = await chat_once(
            [{"role": "user", "content": user_prompt}],
            use_reasoner=False,
            system_prompt=TRANSLATE_SYSTEM_PROMPT,
        )
        raw = strip_markdown_code_block(raw)

        # 尝试解析 JSON
        try:
            parsed = json.loads(raw)
            return parsed.get("translated", ""), None
        except (json.JSONDecodeError, ValueError):
            pass

        # 降级：提取 JSON 对象再试
        extracted = _extract_json_object(raw)
        try:
            parsed = json.loads(extracted)
            return parsed.get("translated", ""), None
        except (json.JSONDecodeError, ValueError):
            pass

        # 最终降级：AI 返回了纯文本，直接当作译文使用
        # 过滤掉明显的非译文内容（如 markdown 标记残留）
        fallback = re.sub(r"^[`\s]+|[`\s]+$", "", raw)
        if fallback and len(fallback) <= len(text) * 10:
            return fallback, None

        return None, "翻译服务返回格式异常，请重试"

    except Exception as e:
        return None, str(e)
