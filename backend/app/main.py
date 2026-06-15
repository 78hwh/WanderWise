"""FastAPI 应用入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, chat, itinerary as itinerary_router, recommend, translate
from app.models import user, conversation, memory, itinerary as itinerary_model, recommendation  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(title="WanderWise - 智能旅行助手", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发阶段允许所有来源（含手机访问）
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(itinerary_router.router)
app.include_router(recommend.router)
app.include_router(translate.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "WanderWise"}