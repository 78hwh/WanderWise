@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   WanderWise 智能旅行助手
echo ========================================
echo.

REM --- 检查后端依赖 ---
echo [1/4] 检查后端依赖...
cd /d "%~dp0backend"
pip show fastapi >nul 2>&1
if %errorlevel% neq 0 (
    echo       正在安装后端依赖...
    pip install -r requirements.txt
) else (
    echo       后端依赖已就绪 √
)

REM --- 检查前端依赖 ---
echo [2/4] 检查前端依赖...
cd /d "%~dp0frontend"
if not exist "node_modules\" (
    echo       正在安装前端依赖...
    call npm install
) else (
    echo       前端依赖已就绪 √
)

echo.
echo [3/4] 启动后端服务 (localhost:5001)...
cd /d "%~dp0backend"
start "WanderWise-Backend" /MIN py -3.13 -m uvicorn app.main:app --host 0.0.0.0 --port 5001

echo [4/4] 启动前端服务 (localhost:5173)...
cd /d "%~dp0frontend"
start "WanderWise-Frontend" /MIN npx vite --host

echo       等待服务启动...
timeout /t 8 /nobreak >nul

REM --- 获取本机局域网 IP（取第一个 192.168.x.x）---
set LAN_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r "192\.168\."') do (
    set TMP=%%a
    set TMP=!TMP: =!
    if "!LAN_IP!"=="" if "!TMP:~0,8!"=="192.168." set LAN_IP=!TMP!
)

start http://localhost:5173

echo.
echo ========================================
echo   电脑访问: http://localhost:5173
if defined LAN_IP echo   手机访问: http://!LAN_IP!:5173
echo   后端文档: http://localhost:5001/docs
echo.
echo   关闭方法: 按任意键停止所有服务
echo ========================================
pause >nul

echo 正在停止服务...
taskkill /FI "WINDOWTITLE eq WanderWise-Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq WanderWise-Frontend*" /T /F >nul 2>&1
echo 已停止所有服务，再见！
timeout /t 2 /nobreak >nul
