"""翻译 API"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.translate_service import translate_text

router = APIRouter(prefix="/api/translate", tags=["翻译"])


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=3000, description="待翻译文本")
    target_lang: str = Field("中文", description="目标语言")
    source_lang: str = Field("auto", description="源语言，auto 为自动检测")


class TranslateResponse(BaseModel):
    translated: str = Field(..., description="译文")


@router.post("", response_model=TranslateResponse)
async def translate(body: TranslateRequest):
    """翻译文本"""
    result, error = await translate_text(
        text=body.text,
        target_lang=body.target_lang,
        source_lang=body.source_lang,
    )
    if error:
        raise HTTPException(status_code=422, detail=error)
    if result is None:
        raise HTTPException(status_code=500, detail="翻译失败")
    return TranslateResponse(translated=result)
