# 🌍 WanderWise — 智能旅行助手

> 让每一次出发，都充满期待。

**WanderWise** 是一款基于 AI 的智能旅行助手，提供个性化行程规划、目的地推荐、多语言翻译和旅行偏好记忆。像和朋友聊天一样规划你的完美旅程。

<p align="center">
  <img src="https://img.shields.io/badge/backend-FastAPI-009688?style=flat-square&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/frontend-React_19-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/AI-DeepSeek-4B32C1?style=flat-square" alt="DeepSeek">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT">
</p>

---

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| 💬 **智能对话** | SSE 流式输出，像和朋友聊天一样交互，支持深度推理模式 |
| 🗺️ **行程生成** | AI 驱动的个性化行程规划，支持目的地、天数、预算定制 |
| 🎯 **目的地推荐** | 根据旅行风格、预算、季节智能推荐目的地 |
| 🌐 **多语言翻译** | 支持任意语言互译，自动检测源语言 |
| 🧠 **偏好记忆** | 自动从对话中学习你的旅行偏好，越用越懂你 |
| 🔐 **用户系统** | JWT 认证，注册/登录，个人数据隔离 |

## 🏗️ 技术架构

```
travel-assistant/
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── main.py             # 应用入口，路由注册
│   │   ├── config.py           # 环境变量与配置
│   │   ├── database.py         # SQLAlchemy 引擎（SQLite/PostgreSQL）
│   │   ├── models/             # 数据模型层
│   │   │   ├── user.py         # 用户模型
│   │   │   ├── conversation.py # 对话模型
│   │   │   ├── memory.py       # 用户偏好记忆
│   │   │   ├── itinerary.py    # 行程模型
│   │   │   └── recommendation.py # 推荐记录
│   │   ├── schemas/            # Pydantic 请求/响应 Schema
│   │   ├── routers/            # API 路由层（auth, chat, itinerary, recommend, translate）
│   │   ├── services/           # 业务逻辑层
│   │   │   ├── ai_client.py    # DeepSeek AI 客户端（OpenAI 兼容接口）
│   │   │   ├── itinerary_service.py
│   │   │   ├── recommend_service.py
│   │   │   ├── translate_service.py
│   │   │   └── memory_service.py  # 偏好提取与记忆管理
│   │   └── middleware/         # JWT 认证中间件
│   ├── tests/                  # pytest 单元测试
│   └── requirements.txt
│
└── frontend/                   # React 前端
    ├── src/
    │   ├── App.tsx             # 路由配置（含路由守卫）
    │   ├── pages/              # 页面组件
    │   │   ├── HomePage.tsx    # 首页
    │   │   ├── ChatPage.tsx    # AI 对话页
    │   │   ├── ItineraryPage.tsx   # 行程管理
    │   │   ├── RecommendPage.tsx   # 目的地推荐
    │   │   ├── TranslatePage.tsx   # 翻译工具
    │   │   ├── LoginPage.tsx   # 登录/注册
    │   │   └── PreferencesPage.tsx # 偏好管理
    │   ├── components/         # 通用组件
    │   └── lib/                # API 封装（含 SSE 流式请求）
    ├── vite.config.ts
    └── package.json
```

### 技术栈

**后端：**
- **框架：** FastAPI → 高性能异步 Web 框架
- **ORM：** SQLAlchemy → 支持 SQLite（开发）和 PostgreSQL（生产）
- **认证：** JWT（python-jose + passlib + bcrypt）
- **AI：** DeepSeek API（兼容 OpenAI 协议）→ `deepseek-chat` / `deepseek-reasoner`
- **数据校验：** Pydantic v2

**前端：**
- **框架：** React 19 + TypeScript
- **样式：** Tailwind CSS v4
- **路由：** React Router v7
- **构建：** Vite

## 🚀 快速开始

### 环境要求

- Python 3.11+
- Node.js 20+
- DeepSeek API Key（[获取地址](https://platform.deepseek.com/api_keys)）

### 1. 克隆项目

```bash
git clone https://github.com/78hwh/travel-assistant.git
cd travel-assistant
```

### 2. 启动后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量（复制并编辑 .env）
cp .env.example .env
```

编辑 `backend/.env` 文件：

```env
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
SECRET_KEY=your-random-secret-key
DATABASE_URL=sqlite:///./travel_assistant.db
FRONTEND_URL=http://localhost:5173
```

```bash
# 启动后端服务
uvicorn app.main:app --reload --port 8000
```

API 文档自动生成：http://localhost:8000/docs

### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器打开：http://localhost:5173

## 🔌 API 概览

| 模块 | 方法 | 端点 | 说明 |
|------|------|------|------|
| 认证 | `POST` | `/api/auth/register` | 用户注册 |
| 认证 | `POST` | `/api/auth/login` | 用户登录，返回 JWT |
| 认证 | `GET` | `/api/auth/me` | 获取当前用户信息 |
| 聊天 | `POST` | `/api/chat/send` | 发送消息（SSE 流式） |
| 聊天 | `GET` | `/api/chat/history` | 对话历史列表 |
| 聊天 | `GET` | `/api/chat/{id}` | 对话详情 |
| 聊天 | `DELETE` | `/api/chat/{id}` | 删除对话 |
| 记忆 | `GET` | `/api/chat/memories` | 获取偏好记忆 |
| 记忆 | `DELETE` | `/api/chat/memories/clear` | 清空记忆 |
| 行程 | `POST` | `/api/itinerary/generate` | AI 生成行程 |
| 行程 | `GET` | `/api/itinerary` | 行程列表 |
| 行程 | `DELETE` | `/api/itinerary/{id}` | 删除行程 |
| 推荐 | `POST` | `/api/recommend/generate` | AI 生成推荐 |
| 推荐 | `GET` | `/api/recommend/history` | 推荐历史 |
| 推荐 | `POST` | `/api/recommend/{id}/feedback` | 提交反馈 |
| 翻译 | `POST` | `/api/translate` | 文本翻译 |

## 🧪 运行测试

```bash
cd backend
pytest --cov=app --cov-report=term-missing
```

## 📄 项目特色

- 🎨 **流的对话体验** — SSE 实时流式输出，打字机效果
- 🧠 **个性化记忆** — 自动从对话中提取偏好（目的地、预算、风格…），下次对话自动融入
- 🤔 **双模切换** — 普通对话（快速）与深度推理（复杂问题）模式可选
- 📱 **响应式设计** — 移动端 H5 适配，底部 TabBar 导航
- 🔐 **安全设计** — JWT 认证、密码 bcrypt 哈希、CORS 白名单
- 🧩 **清晰分层** — Router → Service → Model 三层架构，职责分离

## 📝 待办事项

- [ ] 第三方登录（微信 / Google OAuth）
- [ ] 行程分享与协作编辑
- [ ] 实时天气集成
- [ ] 预算跟踪与费用记账
- [ ] PWA 离线支持

## 📄 License

MIT © WanderWise
