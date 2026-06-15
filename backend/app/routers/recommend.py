"""推荐 API —— 生成推荐、历史记录、反馈"""
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.recommendation import Recommendation
from app.schemas.recommend import (
    RecommendRequest,
    RecommendResponse,
    RecommendationHistoryItem,
    FeedbackRequest,
)
from app.services.recommend_service import generate_recommendations, save_recommendations

router = APIRouter(prefix="/api/recommend", tags=["推荐"])


@router.post("/generate", response_model=RecommendResponse)
async def generate(
    body: RecommendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """AI 生成目的地推荐"""
    result, error = await generate_recommendations(
        travel_style=body.travel_style,
        budget=body.budget,
        season=body.season,
        extra=body.extra,
        db=db,
        user_id=current_user.id,
    )

    if error:
        raise HTTPException(status_code=422, detail=error)
    if result is None:
        raise HTTPException(status_code=500, detail="推荐生成失败")

    # 持久化
    saved_ids = save_recommendations(db, current_user.id, result)

    # 将数据库 ID 回填到响应中，前端需要用于反馈
    for item, item_id in zip(result.destinations, saved_ids):
        item.id = item_id

    return result


@router.get("/history", response_model=list[RecommendationHistoryItem])
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取推荐历史"""
    recs = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.created_at.desc())
        .limit(50)
        .all()
    )

    result: list[RecommendationHistoryItem] = []
    for r in recs:
        tags = json.loads(r.tags_json) if r.tags_json else []
        result.append(
            RecommendationHistoryItem(
                id=r.id,
                destination=r.destination,
                reason=r.reason,
                tags=tags,
                score=r.score,
                feedback=r.feedback,
                created_at=r.created_at,
            )
        )
    return result


@router.post("/{rec_id}/feedback")
def submit_feedback(
    rec_id: int,
    body: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """对推荐结果提交反馈"""
    rec = db.query(Recommendation).filter(
        Recommendation.id == rec_id,
        Recommendation.user_id == current_user.id,
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="推荐记录不存在")

    rec.feedback = body.feedback
    db.commit()
    return {"ok": True}