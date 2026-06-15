"""行程 API —— 生成、列表、详情、删除"""
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.itinerary import Itinerary
from app.schemas.itinerary import (
    GenerateItineraryRequest,
    ItineraryListItem,
    ItineraryDetail,
    ItineraryContent,
)
from app.services.itinerary_service import generate_itinerary_content

router = APIRouter(prefix="/api/itinerary", tags=["行程"])


@router.post("/generate", response_model=ItineraryDetail)
async def generate_itinerary(
    body: GenerateItineraryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """AI 生成行程计划"""
    content, error = await generate_itinerary_content(
        destination=body.destination,
        days=body.days,
        budget=body.budget,
        extra_requirements=body.extra_requirements,
        db=db,
        user_id=current_user.id,
    )

    if error:
        raise HTTPException(status_code=422, detail=error)

    if content is None:
        raise HTTPException(status_code=500, detail="行程生成失败")

    # 提取标题
    title = f"{body.destination} {body.days}日游"

    itinerary = Itinerary(
        user_id=current_user.id,
        conversation_id=body.conversation_id,
        title=title,
        destination=body.destination,
        days=body.days,
        content_json=content.model_dump_json(ensure_ascii=False),
        status="completed",
    )
    db.add(itinerary)
    db.commit()
    db.refresh(itinerary)

    return ItineraryDetail(
        id=itinerary.id,
        title=itinerary.title,
        destination=itinerary.destination,
        days=itinerary.days,
        content=content,
        status=itinerary.status,
        created_at=itinerary.created_at,
        updated_at=itinerary.updated_at,
    )


@router.get("", response_model=list[ItineraryListItem])
def list_itineraries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取当前用户的所有行程列表"""
    itineraries = (
        db.query(Itinerary)
        .filter(Itinerary.user_id == current_user.id)
        .order_by(Itinerary.updated_at.desc())
        .all()
    )
    return itineraries


@router.get("/{itinerary_id}", response_model=ItineraryDetail)
def get_itinerary(
    itinerary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取单个行程详情"""
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == itinerary_id,
        Itinerary.user_id == current_user.id,
    ).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="行程不存在")

    content = ItineraryContent(**json.loads(itinerary.content_json))

    return ItineraryDetail(
        id=itinerary.id,
        title=itinerary.title,
        destination=itinerary.destination,
        days=itinerary.days,
        content=content,
        status=itinerary.status,
        created_at=itinerary.created_at,
        updated_at=itinerary.updated_at,
    )


@router.delete("/{itinerary_id}")
def delete_itinerary(
    itinerary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除行程"""
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == itinerary_id,
        Itinerary.user_id == current_user.id,
    ).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="行程不存在")
    db.delete(itinerary)
    db.commit()
    return {"ok": True}