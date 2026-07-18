#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AI_DIR="$(dirname "$SCRIPT_DIR")"

cd "$AI_DIR"

export TF_CPP_MIN_LOG_LEVEL=3
export PYTHONWARNINGS="ignore"
export GRPC_VERBOSITY=ERROR
export PROTOBUF_PYTHON_GENERATED_CODE_SHOULD_NOT_BE_USED_WARNING=0

WARN_SUPPRESS="import warnings; warnings.filterwarnings('ignore')"

case "${1:-help}" in
    ingest)
        echo "=== Ingesting documents ==="
        python -c "
$WARN_SUPPRESS
import sys; sys.path.insert(0, '.')
from ingestion.ingest import ingest_all
ingest_all()
" 2>/dev/null
        ;;
    query)
        QUERY="${2:-Lãi suất vay tín chấp hiện nay là bao nhiêu?}"
        echo "=== Query: $QUERY ==="
        python -c "
$WARN_SUPPRESS
import sys, asyncio, json; sys.path.insert(0, '.')
from ingestion.ingest import _load_chunks
from ingestion.qdrant_indexer import search as qdrant_search
from ingestion.embedder import get_model
from rag.retriever import build_bm25_index, hybrid_search
from rag.rag_pipeline import answer

chunks = _load_chunks(None)
print(f'Loaded {len(chunks)} chunks')

model = get_model()
build_bm25_index([{'chunk_id': c.chunk_id, 'text': c.text} for c in chunks])

result = asyncio.run(answer('$QUERY'))
print()
print('Answer:', result.answer)
print()
print('Sources:', result.sources)
if result.conflicts:
    print('Conflicts:', result.conflicts)
if result.graph:
    print()
    print('Graph:', json.dumps(result.graph, indent=2, ensure_ascii=False))
" 2>/dev/null
        ;;
    eval)
        echo "=== Running benchmark evaluation ==="
        python -W ignore demo.py eval 2>/dev/null
        ;;
    eval-graph)
        echo "=== Running benchmark evaluation with Graph RAG ==="
        BYPASS_LLM=true NO_GRAPH=false NO_GRAPH_EXPANSION=false python -W ignore demo.py eval
        ;;
    eval-nograph)
        echo "=== Running benchmark evaluation with RAG thường (No Graph) ==="
        BYPASS_LLM=true NO_GRAPH=true python -W ignore demo.py eval
        ;;
    eval-nograph-expansion)
        echo "=== Running benchmark evaluation without Graph Expansion ==="
        BYPASS_LLM=true NO_GRAPH=false NO_GRAPH_EXPANSION=true python -W ignore demo.py eval
        ;;
    chat)
        echo "=== Starting interactive chat ==="
        python -W ignore demo.py chat 2>/dev/null
        ;;
    dates)
        echo "=== Query active clauses by date ==="
        DATE="${2:-2025-01-01}"
        python -c "
$WARN_SUPPRESS
import sys; sys.path.insert(0, '.')
from ingestion.ingest import _load_chunks
from ingestion.neo4j_client import get_active_documents, get_active_clauses

chunks = _load_chunks(None)

print()
print(f'Active documents as of {\"$DATE\"}:')
docs = get_active_documents('$DATE')
for d in docs:
    print(f'  {d[\"id\"]:15s} {d[\"effective_date\"]} to {d.get(\"expiry_date\", \"N/A\")}')
print(f'Total: {len(docs)}')

print()
print(f'Active clauses as of {\"$DATE\"}:')
clauses = get_active_clauses('$DATE')
for c in clauses[:10]:
    print(f'  {c[\"id\"]:20s} doc={c[\"document_id\"]:15s} eff={c.get(\"effective_date\")} exp={c.get(\"expiry_date\")}')
if len(clauses) > 10:
    print(f'  ... and {len(clauses) - 10} more')
print(f'Total: {len(clauses)}')
" 2>/dev/null
        ;;
    help|*)
        echo "Usage: $0 <command> [args]"
        echo ""
        echo "Commands:"
        echo "  ingest          Ingest all documents into Qdrant + Neo4j"
        echo "  query [text]    Run a RAG query (default: interest rate question)"
        echo "  eval                    Run benchmark evaluation (first 5 questions, default RAG)"
        echo "  eval-graph              Run full benchmark evaluation (Graph RAG with bypassed LLM)"
        echo "  eval-nograph            Run full benchmark evaluation (RAG thường with bypassed LLM)"
        echo "  eval-nograph-expansion  Run full benchmark evaluation (No graph expansion with bypassed LLM)"
        echo "  chat                    Start interactive chat"
        echo "  dates [date]            Show active documents/clauses at a date"
        echo "  help                    Show this help"
        ;;
esac
