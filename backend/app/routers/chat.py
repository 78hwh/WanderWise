"""聊天 API —— 包括流式 SSE 对话、记忆管理"""
import json
import asyncio
from datetime import datetime

from app.models.user import now_beijing

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.models.memory import UserMemory
from app.schemas.chat import (
    SendMessageRequest,
    ConversationResponse,
    ConversationDetail,
    ChatMessage,
    MemoryResponse,
)
from app.services.ai_client import chat_stream
from app.services.memory_service import (
    build_system_prompt,
    extract_preferences_from_messages,
    merge_preferences,
)

router = APIRouter(prefix="/api/chat", tags=["聊天"])


def _parse_messages(conv: Conversation) -> list[dict]:
    """解析会话中的消息 JSON"""
    return json.loads(conv.messages_json) if conv.messages_json else []


# ---------------------------------------------------------------------------
# 记忆管理 API（必须放在 /{conversation_id} 之前，否则路由冲突）
# ---------------------------------------------------------------------------


@router.get("/memories", response_model=list[MemoryResponse])
def get_memories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取当前用户的所有偏好记忆"""
    memories = (
        db.query(UserMemory)
        .filter(UserMemory.user_id == current_user.id)
        .order_by(UserMemory.category, UserMemory.confidence.desc())
        .all()
    )
    return [MemoryResponse.model_validate(m) for m in memories]


@router.delete("/memories/clear")
def clear_memories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """清空当前用户的所有偏好记忆"""
    db.query(UserMemory).filter(
        UserMemory.user_id == current_user.id,
    ).delete()
    db.commit()
    return {"ok": True}


@router.delete("/memories/{memory_id}")
def delete_memory(
    memory_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除单条偏好记忆"""
    memory = db.query(UserMemory).filter(
        UserMemory.id == memory_id,
        UserMemory.user_id == current_user.id,
    ).first()
    if not memory:
        raise HTTPException(status_code=404, detail="记忆不存在")
    db.delete(memory)
    db.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# 对话 API
# ---------------------------------------------------------------------------


@router.post("/send")
async def send_message(
    body: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """发送消息，SSE 流式返回 AI 回复"""
    # 1. 找到或创建会话
    if body.conversation_id:
        conv = db.query(Conversation).filter(
            Conversation.id == body.conversation_id,
            Conversation.user_id == current_user.id,
        ).first()
        if not conv:
            raise HTTPException(status_code=404, detail="会话不存在")
        messages: list[dict] = _parse_messages(conv)
    else:
        conv = Conversation(user_id=current_user.id)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        messages = []

    # 2. 追加用户消息
    messages.append({"role": "user", "content": body.message})

    # 3. 构建给 AI 的消息列表 + 个性化 System Prompt
    ai_messages = messages[-20:]

    async def generate():
        nonlocal messages
        full_reply = ""
        system_prompt = build_system_prompt(db, current_user.id)
        try:
            async for chunk in chat_stream(
                ai_messages,
                use_reasoner=body.use_reasoner,
                system_prompt=system_prompt,
            ):
                full_reply += chunk
                yield f"data: {json.dumps({'chunk': chunk}, ensure_ascii=False)}\n\n"
                await asyncio.sleep(0)

            # 4. 保存完整回复到数据库
            messages.append({"role": "assistant", "content": full_reply})
            conv.messages_json = json.dumps(messages, ensure_ascii=False)

            # 自动更新标题
            if conv.title == "新对话" and len(messages) >= 1:
                first_user = next(
                    (m["content"] for m in messages if m["role"] == "user"), ""
                )
                conv.title = first_user[:30] + ("..." if len(first_user) > 30 else "")

            conv.updated_at = now_beijing()
            db.commit()

            # 发送完成信号
            yield f"data: {json.dumps({'done': True, 'conversation_id': conv.id})}\n\n"

            # 5. 异步提取偏好（不影响响应）
            try:
                extracted = await extract_preferences_from_messages(messages)
                if extracted:
                    merge_preferences(db, current_user.id, int(conv.id), extracted)
            except Exception:
                pass  # 提取失败不影响用户体验

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history", response_model=list[ConversationResponse])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取当前用户的所有对话列表"""
    convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return convs


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取单个会话详情（含完整消息）"""
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="会话不存在")

    messages = _parse_messages(conv)
    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        messages=[ChatMessage(**m) for m in messages],
        created_at=conv.created_at,
        updated_at=conv.updated_at,
    )


@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除对话"""
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="会话不存在")
    db.delete(conv)
    db.commit()
    return {"ok": True}
