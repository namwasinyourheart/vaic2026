"""
Orchestrator: parse all documents → embed → index to Qdrant → build Neo4j graph.
"""
from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import DOCS_DIR, METADATA_DIR, GRAPH_DIR
from .router import parse_document
from .embedder import embed_texts
from .qdrant_indexer import upsert_chunks, ensure_collection
from .base_parser import Chunk


def _load_chunks(docs_dir: Path | None = None) -> list[Chunk]:
    docs_dir = docs_dir or DOCS_DIR
    all_chunks: list[Chunk] = []
    clauses_meta_path = METADATA_DIR / "clauses.json"
    clauses_meta = {}
    if clauses_meta_path.exists():
        with open(clauses_meta_path, encoding="utf-8") as f:
            clauses_meta = {c["clause_id"]: c for c in json.load(f)}

    md_files = sorted(docs_dir.glob("*.md"))
    for md_path in md_files:
        chunks = parse_document(md_path, clauses_meta or None)
        all_chunks.extend(chunks)

    return all_chunks


def ingest_all(docs_dir: Path | None = None) -> list[Chunk]:
    docs_dir = docs_dir or DOCS_DIR

    all_chunks = _load_chunks(docs_dir)
    print(f"Parsed {len(all_chunks)} chunks from {len(sorted(docs_dir.glob('*.md')))} documents")

    texts = [c.text for c in all_chunks]
    print("Embedding...")
    embeddings = embed_texts(texts)
    for chunk, emb in zip(all_chunks, embeddings):
        chunk.embedding = emb

    print("Indexing to Qdrant...")
    upsert_chunks(all_chunks)

    graph_json_path = GRAPH_DIR / "knowledge_graph.json"
    if graph_json_path.exists():
        print("Building Neo4j graph...")
        from .neo4j_client import clear_database, build_graph
        clear_database()
        build_graph(graph_json_path, all_chunks)

    print(f"\nIngestion complete: {len(all_chunks)} chunks indexed")
    return all_chunks


if __name__ == "__main__":
    ingest_all()
