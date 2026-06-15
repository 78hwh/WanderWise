"""DeepSeek AI 客户端 —— 封装 OpenAI 兼容接口"""
from openai import AsyncOpenAI

from app.config import settings
from app.services.utils import BASE_SYSTEM_PROMPT as FALLBACK_SYSTEM_PROMPT

# 创建异步客户端（DeepSeek 兼容 OpenAI 协议）
client = AsyncOpenAI(
    api_key=settings.DEEPSEEK_API_KEY,
    base_url=settings.DEEPSEEK_BASE_URL,
)


async def chat_stream(
    messages: list[dict],
    use_reasoner: bool = False,
    system_prompt: str | None = None,
):
    """流式对话 —— 异步生成器，逐块返回 AI 回复

    Args:
        messages: OpenAI 格式的消息列表 [{"role": "user", "content": "..."}]
        use_reasoner: True 用 deepseek-reasoner，False 用 deepseek-chat
        system_prompt: 自定义 system prompt，不传则用默认

    Yields:
        str: 逐块返回的文字
    """
    model = "deepseek-reasoner" if use_reasoner else "deepseek-chat"

    full_messages = [
        {"role": "system", "content": system_prompt or FALLBACK_SYSTEM_PROMPT},
        *messages,
    ]

    stream = await client.chat.completions.create(
        model=model,
        messages=full_messages,
        stream=True,
        temperature=0.7,
        max_tokens=2048,
    )

    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


async def chat_once(
    messages: list[dict],
    use_reasoner: bool = False,
    system_prompt: str | None = None,
) -> str:
    """非流式对话 —— 返回完整回复字符串"""
    model = "deepseek-reasoner" if use_reasoner else "deepseek-chat"

    full_messages = [
        {"role": "system", "content": system_prompt or FALLBACK_SYSTEM_PROMPT},
        *messages,
    ]

    response = await client.chat.completions.create(
        model=model,
        messages=full_messages,
        temperature=0.7,
        max_tokens=2048,
    )

    return response.choices[0].message.content or ""