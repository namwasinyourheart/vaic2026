#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AI_DIR="$(dirname "$SCRIPT_DIR")"
cd "$AI_DIR"

export TF_CPP_MIN_LOG_LEVEL=3
export PYTHONWARNINGS="ignore"

python ingestion/ingest.py 2>/dev/null
