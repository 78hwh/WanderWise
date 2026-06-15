# WanderWise — 智能旅行助手

基于 AI 的个性化旅行规划助手，Frontend（React + Vite + Tailwind CSS）。

## 技术栈

- **React 19** + **TypeScript 6**
- **Vite 8** (dev server + build)
- **Tailwind CSS v4** (设计系统)
- **React Router v7** (客户端路由)

## 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器 (默认 http://localhost:5173)
npx vite --host
```

前端通过 Vite 代理将 `/api/*` 请求转发到后端（需要先启动 FastAPI 后端，默认 `localhost:5001`）。

## 项目结构

```
src/
├── components/layout/    # 布局组件 (Header)
├── lib/                  # API 客户端、工具函数
├── pages/                # 页面组件
│   ├── HomePage.tsx      # 首页
│   ├── ChatPage.tsx      # AI 对话（SSE 流式）
│   ├── LoginPage.tsx     # 登录/注册
│   ├── PreferencesPage.tsx # 偏好记忆管理
│   ├── ItineraryPage.tsx # 行程规划
│   ├── RecommendPage.tsx # 智能推荐
│   └── TranslatePage.tsx # 多语言翻译
├── assets/               # 静态资源
└── App.tsx               # 根组件 + 路由
```

## 后端依赖

需要运行 FastAPI 后端（`backend/` 目录）。详见后端 `requirements.txt`。

## 构建

```bash
npm run build    # 输出到 dist/
npm run preview  # 预览构建产物
```
