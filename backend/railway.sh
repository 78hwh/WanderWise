#!/bin/bash
set -e

echo "Installing backend dependencies..."
pip install -r requirements.txt

echo "Starting WanderWise backend..."
uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-5001}"
