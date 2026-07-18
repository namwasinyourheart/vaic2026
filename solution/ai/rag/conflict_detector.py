from __future__ import annotations
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from ingestion.neo4j_client import get_conflicts


def detect_conflicts(chunk_ids: list[str]) -> list[dict[str, str]]:
    return get_conflicts(chunk_ids)
