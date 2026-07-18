#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AI_DIR="$(dirname "$SCRIPT_DIR")"

cd "$AI_DIR"

export TF_CPP_MIN_LOG_LEVEL=3
export PYTHONWARNINGS="ignore"
export GRPC_VERBOSITY=ERROR
export PROTOBUF_PYTHON_GENERATED_CODE_SHOULD_NOT_BE_USED_WARNING=0

PORT="${1:-8000}"

echo "Starting VAIC2026 Banking RAG API on port $PORT..."
echo "Docs: http://localhost:$PORT/docs"

exec python scripts/server.py --port "$PORT" 2>/dev/null
