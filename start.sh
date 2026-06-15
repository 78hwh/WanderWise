#!/bin/bash
echo "========================================"
echo "  WanderWise 智能旅行助手 - 启动中..."
echo "========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Check backend deps
echo "[1/4] 检查后端依赖..."
cd "$SCRIPT_DIR/backend"
pip show fastapi >/dev/null 2>&1 || pip install -r requirements.txt
echo "后端依赖已就绪 ✓"

# Check frontend deps
echo "[2/4] 检查前端依赖..."
cd "$SCRIPT_DIR/frontend"
[ -d "node_modules" ] || npm install
echo "前端依赖已就绪 ✓"

# Start backend
echo "[3/4] 启动后端服务 (端口 5001)..."
cd "$SCRIPT_DIR/backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 5001 --reload &
BACKEND_PID=$!

# Start frontend
echo "[4/4] 启动前端服务 (端口 5173)..."
cd "$SCRIPT_DIR/frontend"
npx vite --host &
FRONTEND_PID=$!

sleep 3
echo ""
echo "========================================"
echo "  启动完成！"
echo "  前端: http://localhost:5173"
echo "  后端文档: http://localhost:5001/docs"
echo "  Ctrl+C 停止所有服务"
echo "========================================"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
