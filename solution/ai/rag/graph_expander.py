from __future__ import annotations
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from ingestion.neo4j_client import get_references


def expand_references(chunk_ids: list[str], hops: int = 2) -> set[str]:
    return get_references(chunk_ids, hops)
