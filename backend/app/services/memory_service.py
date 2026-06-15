"""记忆服务 —— 从对话中提取偏好、注入 System Prompt"""
import json

from sqlalchemy.orm import Session

from app.models.memory import UserMemory
from app.services.ai_client import chat_once
from app.services.utils import strip_markdown_code_block, BASE_SYSTEM_PROMPT

# ---------------------------------------------------------------------------
# 偏好提取
# ---------------------------------------------------------------------------

EXTRACTION_PROMPT = """分析以下用户与旅行助手的对话，提取用户的旅行偏好。只提取 明确表达 的偏好，不要猜测。

返回 JSON 数组，每条偏好包含：
- category: 类别（必须是以下之一：destination, budget, travel_style, food, accommodation, transportation, pace, companion, season, special_interest, language, other）
- key: 偏好的键名（如"预算范围"、"喜欢的城市风格"）
- value: 偏好的值（如"人均5000以下"、"海滨小镇"）
- confidence: 置信度 0.0-1.0（用户明确说出的给 0.9+，强烈暗示的给 0.5-0.8）

只返回 JSON 数组，不要其他文字。如果没有可提取的偏好，返回空数组 []。
对话：
"""


async def extract_preferences_from_messages(
    messages: list[dict],
) -> list[dict]:
    """调用 AI 从对话历史中提取用户偏好"""
    if not messages:
        return []

    # 取最近 10 轮对话，减少 token 消耗
    recent = messages[-10:]
    conversation_text = "\n".join(
        f"{'用户' if m['role'] == 'user' else '助手'}: {m['content']}" for m in recent
    )

    try:
        raw = await chat_once(
            [{"role": "user", "content": EXTRACTION_PROMPT + conversation_text}],
            use_reasoner=False,
        )
        # 去除可能的 markdown 代码块标记
        raw = strip_markdown_code_block(raw)
        result: list[dict] = json.loads(raw)
        return result if isinstance(result, list) else []
    except Exception:
        # 提取失败不影响主流程
        return []


def merge_preferences(
    db: Session,
    user_id: int,
    conversation_id: int,
    extracted: list[dict],
) -> int:
    """将提取到的偏好合并入库（去重覆盖、提高置信度）

    返回新增/更新的记忆条数。
    """
    changes = 0
    for pref in extracted:
        category = str(pref.get("category", "other"))[:50]
        key = str(pref.get("key", ""))[:100]
        value = str(pref.get("value", ""))[:2000]
        confidence = float(pref.get("confidence", 0.5))
        confidence = max(0.0, min(1.0, confidence))  # 钳制到 [0, 1]

        if not key or not value:
            continue

        # 查找同一用户同一类别同一 key 的记忆
        existing = (
            db.query(UserMemory)
            .filter(
                UserMemory.user_id == user_id,
                UserMemory.category == category,
                UserMemory.key == key,
            )
            .first()
        )

        if existing:
            # 如果值相同，提高置信度
            if existing.value == value:
                existing.confidence = min(1.0, existing.confidence + confidence * 0.3)
            else:
                # 值不同，替换为新值，重置置信度
                existing.value = value
                existing.confidence = confidence
            existing.source_conversation_id = conversation_id
        else:
            db.add(
                UserMemory(
                    user_id=user_id,
                    category=category,
                    key=key,
                    value=value,
                    confidence=confidence,
                    source_conversation_id=conversation_id,
                )
            )
        changes += 1

    if changes:
        db.commit()
    return changes


# ---------------------------------------------------------------------------
# System Prompt 构建
# ---------------------------------------------------------------------------


def format_memory_context(memories: list[UserMemory]) -> str:
    """将记忆列表格式化成可注入 system prompt 的文本"""
    if not memories:
        return ""

    # 按类别分组
    groups: dict[str, list[UserMemory]] = {}
    for m in memories:
        groups.setdefault(m.category, []).append(m)

    category_labels: dict[str, str] = {
        "destination": "🏖️ 目的地偏好",
        "budget": "💰 预算偏好",
        "travel_style": "🎒 旅行风格",
        "food": "🍜 饮食偏好",
        "accommodation": "🏨 住宿偏好",
        "transportation": "🚗 交通偏好",
        "pace": "⏳ 节奏偏好",
        "companion": "👨‍👩‍👧 同行者",
        "season": "📅 季节偏好",
        "special_interest": "⭐ 特别兴趣",
        "language": "🗣️ 语言偏好",
        "other": "📌 其他偏好",
    }

    lines: list[str] = []
    lines.append("用户的已知偏好（根据历史对话积累）：")
    for cat, items in groups.items():
        label = category_labels.get(cat, cat)
        prefs = "；".join(f"{m.key}: {m.value}" for m in items)
        lines.append(f"- {label}：{prefs}")

    lines.append("在对话中自然地利用这些偏好来提供个性化建议，但不要生硬地复述它们。")
    return "\n".join(lines)


def build_system_prompt(db: Session, user_id: int) -> str:
    """构建包含用户偏好的完整 system prompt"""
    memories = (
        db.query(UserMemory)
        .filter(UserMemory.user_id == user_id)
        .order_by(UserMemory.confidence.desc())
        .all()
    )

    context = format_memory_context(memories)
    if context:
        return BASE_SYSTEM_PROMPT + "\n\n" + context
    return BASE_SYSTEM_PROMPT
