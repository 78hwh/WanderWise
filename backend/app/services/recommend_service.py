"""推荐服务 —— Prompt 构建 + AI 生成 + 天气查询"""
import json
import urllib.parse

import httpx
from sqlalchemy.orm import Session

from app.models.memory import UserMemory
from app.models.recommendation import Recommendation
from app.schemas.recommend import RecommendResponse, DestinationItem
from app.services.ai_client import chat_once
from app.services.memory_service import format_memory_context
from app.services.utils import strip_markdown_code_block

# ---- AI Prompt ----

RECOMMEND_SYSTEM_PROMPT = """你是一位资深旅行推荐师。根据用户的偏好和需求，推荐 4-6 个最适合的目的地。

你必须严格按照以下 JSON 格式返回，不要包含任何其他文字、解释或 markdown 标记：

{
  "summary": "整体推荐说明，2-3句话解释为什么推荐这些地方",
  "destinations": [
    {
      "destination": "目的地名称（城市+国家/省份，如 云南大理）",
      "reason": "推荐理由，结合用户偏好说明，2-3句话",
      "tags": ["海滨", "悠闲", "美食"],
      "score": 92,
      "matched_preferences": "你喜欢海滨小镇和悠闲节奏，预算也在你的范围内"
    }
  ]
}

规则：
- 恰好返回 4-6 个目的地
- score 是 1-100 的匹配度分数
- tags 是 3-5 个中文字符串标签
- 每个 reason 必须个性化，提到用户的具体偏好
- matched_preferences 解释为什么会匹配这个用户
- 用中文回复
"""


def build_recommend_prompt(
    travel_style: str,
    budget: str,
    season: str,
    extra: str,
    memories: list[UserMemory],
) -> str:
    parts: list[str] = []
    parts.append("请根据以下需求推荐目的地：")

    if travel_style:
        parts.append(f"- 旅行风格：{travel_style}")
    if budget:
        parts.append(f"- 预算：{budget}")
    if season:
        parts.append(f"- 出行季节：{season}")
    if extra:
        parts.append(f"- 额外要求：{extra}")

    if memories:
        parts.append("")
        parts.append(format_memory_context(memories))
    else:
        parts.append("")
        parts.append("用户暂无历史偏好，请根据请求参数推荐热门且合理的目的地。")

    return "\n".join(parts)


async def generate_recommendations(
    travel_style: str,
    budget: str,
    season: str,
    extra: str,
    db: Session,
    user_id: int,
) -> tuple[RecommendResponse | None, str | None]:
    memories = (
        db.query(UserMemory)
        .filter(UserMemory.user_id == user_id)
        .order_by(UserMemory.confidence.desc())
        .all()
    )

    user_prompt = build_recommend_prompt(travel_style, budget, season, extra, memories)

    try:
        raw = await chat_once(
            [{"role": "user", "content": user_prompt}],
            use_reasoner=False,
            system_prompt=RECOMMEND_SYSTEM_PROMPT,
        )
        raw = strip_markdown_code_block(raw)

        parsed = json.loads(raw)

        # 为每个目的地查天气
        destinations = []
        for item in parsed.get("destinations", []):
            weather = await fetch_weather(item.get("destination", ""))
            destinations.append(
                DestinationItem(
                    destination=item.get("destination", ""),
                    reason=item.get("reason", ""),
                    tags=item.get("tags", []),
                    score=float(item.get("score", 50)),
                    matched_preferences=item.get("matched_preferences", ""),
                    weather=weather,
                )
            )

        response = RecommendResponse(
            summary=parsed.get("summary", ""),
            destinations=destinations,
        )
        return response, None

    except json.JSONDecodeError as e:
        return None, f"AI 返回格式异常，请重试：{e}"
    except Exception as e:
        return None, str(e)


# ---- 天气查询（wttr.in，免费无需 Key）----

async def fetch_weather(destination: str) -> str:
    """查询目的地实时天气，返回简短描述"""
    if not destination:
        return ""
    try:
        # 取中文地名去掉"省/市/区"后缀
        city = destination.split(" ")[0].rstrip("省市自治区")
        enc = urllib.parse.quote(city)
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"https://wttr.in/{enc}?format=%C+%t&lang=zh",
                headers={"User-Agent": "WanderWise/1.0"},
            )
            result = resp.text.strip()
            return f"当前天气：{result}" if result else ""
    except Exception:
        return ""


# ---- 持久化 ----

def save_recommendations(
    db: Session,
    user_id: int,
    result: RecommendResponse,
) -> list[int]:
    ids: list[int] = []
    for item in result.destinations:
        rec = Recommendation(
            user_id=user_id,
            destination=item.destination,
            reason=item.reason,
            tags_json=json.dumps(item.tags, ensure_ascii=False),
            score=item.score,
            matched_preferences=item.matched_preferences,
            weather_json=json.dumps({"summary": item.weather}, ensure_ascii=False),
        )
        db.add(rec)
        db.flush()
        ids.append(int(rec.id))
    db.commit()
    return ids