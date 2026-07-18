from __future__ import annotations
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
import uuid
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import QDRANT_COLLECTION, QDRANT_PATH, EMBEDDING_DIM
from .base_parser import Chunk

_client = None


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(path=QDRANT_PATH)
    return _client


def ensure_collection():
    client = get_client()
    collections = [c.name for c in client.get_collections().collections]
    if QDRANT_COLLECTION not in collections:
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
        )
        print(f"Created collection: {QDRANT_COLLECTION}")


def upsert_chunks(chunks: list[Chunk]):
    client = get_client()
    ensure_collection()

    points = []
    for chunk in chunks:
        if chunk.embedding is None:
            continue
        points.append(
            PointStruct(
                id=str(uuid.uuid5(uuid.NAMESPACE_URL, chunk.chunk_id)),
                vector=chunk.embedding,
                payload=chunk.to_payload(),
            )
        )

    if points:
        batch_size = 100
        for i in range(0, len(points), batch_size):
            client.upsert(collection_name=QDRANT_COLLECTION, points=points[i : i + batch_size])
        print(f"Upserted {len(points)} points to Qdrant")


def search(query_vector: list[float], top_k: int = 20) -> list[dict]:
    from qdrant_client.models import SearchParams
    client = get_client()
    results = client.query_points(
        collection_name=QDRANT_COLLECTION,
        query=query_vector,
        limit=top_k,
    )
    return [{"payload": r.payload, "score": r.score} for r in results.points]
