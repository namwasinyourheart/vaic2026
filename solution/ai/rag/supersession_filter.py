from __future__ import annotations
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from ingestion.neo4j_client import get_superseded_by


def filter_superseded(chunk_ids: list[str]) -> list[str]:
    supersedes_map = get_superseded_by(chunk_ids)
    superseded = set(supersedes_map.keys())
    return [cid for cid in chunk_ids if cid not in superseded]
