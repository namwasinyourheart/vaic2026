from __future__ import annotations
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from ingestion.neo4j_client import get_amended_by, get_superseded_by


def resolve_versions(chunk_ids: list[str]) -> list[str]:
    amends_map = get_amended_by(chunk_ids)
    supersedes_map = get_superseded_by(chunk_ids)
    combined = {**amends_map, **supersedes_map}

    resolved = set()
    for cid in chunk_ids:
        if cid in combined:
            resolved.add(combined[cid])
        else:
            resolved.add(cid)

    return list(resolved)
