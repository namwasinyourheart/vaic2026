"""
CLI chat demo for the banking RAG system.
Usage:
    python demo.py ingest   — Ingest documents into Qdrant
    python demo.py chat     — Interactive chat
    python demo.py eval     — Run benchmark evaluation
"""
import sys
import json
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from config import BENCHMARK_DIR, GROUND_TRUTH_DIR


def cmd_ingest():
    from ingestion.ingest import ingest_all
    ingest_all()


def cmd_chat():
    from ingestion.ingest import ingest_all
    from ingestion.qdrant_indexer import search
    from ingestion.embedder import get_model
    from rag.retriever import hybrid_search, build_bm25_index
    from rag.rag_pipeline import RAGResponse

    print("=== Building search index ===")
    from ingestion.ingest import ingest_all
    chunks = ingest_all()

    bm25_data = [{"chunk_id": c.chunk_id, "text": c.text} for c in chunks]
    build_bm25_index(bm25_data)
    print("Index ready.\n")

    from rag.rag_pipeline import answer

    print("=== Banking RAG Chat ===")
    print("Type 'quit' to exit, 'sources' to show sources.\n")

    last_response = None

    while True:
        try:
            query = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not query:
            continue
        if query.lower() == "quit":
            print("Goodbye!")
            break
        if query.lower() == "sources" and last_response:
            print("\nSources:")
            for s in last_response.sources:
                print(f"  - [{s['chunk_id']}] {s['document_id']} ({s['section_title']})")
                print(f"    {s['text'][:100]}...")
            if last_response.conflicts:
                print("\nConflicts detected:")
                for c in last_response.conflicts:
                    print(f"  - {c['clause_a']} ↔ {c['clause_b']}")
            continue

        try:
            response = asyncio.run(answer(query))
            last_response = response

            print(f"\nAssistant: {response.answer}")
            print(f"\n  [Sources: {', '.join(s['chunk_id'] for s in response.sources)}]")
            if response.conflicts:
                print(f"  [Conflicts: {len(response.conflicts)} detected]")
            if response.graph:
                print(f"  [Graph: {len(response.graph['nodes'])} nodes, {len(response.graph['edges'])} edges]")
            print()
        except Exception as e:
            print(f"Error: {e}\n")


def cmd_eval():
    from ingestion.ingest import ingest_all
    from rag.retriever import build_bm25_index
    from rag.rag_pipeline import answer

    print("=== Building index ===")
    chunks = ingest_all()
    bm25_data = [{"chunk_id": c.chunk_id, "text": c.text} for c in chunks]
    build_bm25_index(bm25_data)

    questions_path = BENCHMARK_DIR / "questions.json"
    answers_path = GROUND_TRUTH_DIR / "answers.json"

    if not questions_path.exists():
        print("No benchmark questions found.")
        return

    with open(questions_path, encoding="utf-8") as f:
        questions = json.load(f)
    with open(answers_path, encoding="utf-8") as f:
        gt_answers = json.load(f)

    gt_map = {a["question_id"]: a for a in gt_answers}

    print(f"\nEvaluating {len(questions)} questions...\n")
    results = []
    for q in questions[:5]:
        qid = q["question_id"]
        query = q["question"]
        qtype = q["question_type"]

            print(f"[{qid}] {qtype}: {query}")
        try:
            response = asyncio.run(answer(query))
            gt = gt_map.get(qid, {})

            source_ids = [s["chunk_id"] for s in response.sources]
            source_overlap = set(source_ids) & set(gt.get("source_clause_ids", []))
            print(f"  Answer: {response.answer[:120]}...")
            print(f"  Sources found: {source_ids[:3]}")
            print(f"  Expected sources: {gt.get('source_clause_ids', [])[:3]}")
            print(f"  Overlap: {len(source_overlap)}/{len(gt.get('source_clause_ids', []))}")
            if response.conflicts:
                print(f"  Conflicts: {response.conflicts}")
            print()

            results.append({
                "question_id": qid,
                "source_overlap": len(source_overlap),
                "expected_sources": len(gt.get("source_clause_ids", [])),
                "has_conflicts": bool(response.conflicts),
            })
        except Exception as e:
            print(f"  ERROR: {e}\n")

    if results:
        avg_overlap = sum(r["source_overlap"] / max(r["expected_sources"], 1) for r in results) / len(results)
        print(f"\n=== Results ===")
        print(f"Evaluated: {len(results)}")
        print(f"Avg source overlap: {avg_overlap:.1%}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "ingest":
        cmd_ingest()
    elif cmd == "chat":
        cmd_chat()
    elif cmd == "eval":
        cmd_eval()
    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)
