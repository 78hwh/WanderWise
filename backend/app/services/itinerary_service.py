"""行程生成服务 —— Prompt 构建 + AI 生成 + JSON 校验"""
import json

from sqlalchemy.orm import Session

from app.models.memory import UserMemory
from app.models.itinerary import Itinerary
from app.schemas.itinerary import ItineraryContent
from app.services.ai_client import chat_once
from app.services.memory_service import format_memory_context
from app.services.utils import strip_markdown_code_block


ITINERARY_SYSTEM_PROMPT = """你是一位经验丰富的旅行规划师。根据用户的需求和偏好，生成详细的结构化行程。

你必须严格按照以下 JSON 格式返回，不要包含任何其他文字、解释或 markdown 标记：

{
  "overview": "行程概览，2-3句话总结",
  "budget_estimate": "预算估算说明",
  "days": [
    {
      "day": 1,
      "title": "当日主题",
      "activities": [
        {
          "time": "09:00-11:00",
          "name": "景点/活动名称",
          "description": "简介",
          "tips": "小贴士（可选，没有则为空字符串）"
        }
      ],
      "meals": [
        {
          "type": "午餐",
          "name": "餐厅/食物名称",
          "description": "推荐理由"
        }
      ],
      "accommodation": "推荐住宿区域或酒店类型",
      "notes": "当日备注（可选，没有则为空字符串）"
    }
  ],
  "general_tips": ["贴士1", "贴士2"]
}

规则：
- days 数组长度必须等于天数
- 每天至少 2 个 activities
- 每天至少 1 个 meal
- time 字段使用 "HH:MM-HH:MM" 格式
- 所有字符串字段不要留 null，没有内容的用空字符串 ""
- 用中文回复
- 根据用户偏好个性化推荐
"""


def build_itinerary_prompt(
    destination: str,
    days: int,
    budget: str,
    extra_requirements: str,
    memories: list[UserMemory],
) -> str:
    """构建生成行程的 user prompt"""
    parts: list[str] = []

    parts.append(f"请为以下需求生成一份 {days} 天的详细行程：")
    parts.append(f"- 目的地：{destination}")
    parts.append(f"- 天数：{days} 天")
    parts.append(f"- 预算：{budget}")
    if extra_requirements:
        parts.append(f"- 额外要求：{extra_requirements}")

    # 注入用户偏好
    if memories:
        parts.append("")
        parts.append(format_memory_context(memories))

    return "\n".join(parts)


async def generate_itinerary_content(
    destination: str,
    days: int,
    budget: str,
    extra_requirements: str,
    db: Session,
    user_id: int,
) -> tuple[ItineraryContent | None, str | None]:
    """调用 AI 生成行程，返回 (解析后的内容, 错误信息)"""
    memories = (
        db.query(UserMemory)
        .filter(UserMemory.user_id == user_id)
        .order_by(UserMemory.confidence.desc())
        .all()
    )

    user_prompt = build_itinerary_prompt(
        destination, days, budget, extra_requirements, memories
    )

    try:
        raw = await chat_once(
            [{"role": "user", "content": user_prompt}],
            use_reasoner=False,
            system_prompt=ITINERARY_SYSTEM_PROMPT,
        )

        # 清理 markdown 代码块
        raw = strip_markdown_code_block(raw)

        parsed = json.loads(raw)
        content = ItineraryContent(**parsed)
        return content, None

    except json.JSONDecodeError as e:
        return None, f"AI 返回格式异常，请重试：{e}"
    except Exception as e:
        return None, str(e)