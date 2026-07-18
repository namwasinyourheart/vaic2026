# Lumina AI Module

RAG Pipeline + Knowledge Graph cho banking document retrieval.

## Architecture

```
User Query
    │
    ▼
┌─────────────────────────┐
│  1. Hybrid Search       │  Vector + BM25 + RRF Fusion
│     retriever.py        │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│  2. Graph Expansion     │  Neo4j BFS (REFERENCES)
│     graph_expander.py   │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│  3. Version Resolution  │  AMENDS chain → latest version
│     version_resolver.py │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│  4. Supersession Filter │  SUPERSEDES → remove old
│     supersession_filter.py │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│  5. Conflict Detection  │  CONFLICTS_WITH → warning
│     conflict_detector.py│
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│  6. LLM Generation      │  Evidence-bound + Citations
│     prompt_builder.py   │
│     llm_service.py      │
└───────────┬─────────────┘
            ▼
       RAGResponse
   (answer, sources, conflicts, graph)
```

## Data Preparation

Documents are crawled from two primary sources:

- **vbpl.vn** — Vietnam's national legal database (Thông tư, Nghị định, Quyết định from SBV, Government, and other authorities)
- **SHB Bank website** — Internal policies, operating procedures, contract templates, and institutional knowledge

Crawled documents are parsed into clause-level chunks, embedded, and indexed into both Qdrant (vector store) and Neo4j (knowledge graph with REFERENCES, AMENDS, SUPERSEDES, CONFLICTS_WITH relationships).

## Benchmark

Lumina significantly outperforms standard RAG systems that lack Knowledge Graph integration:

| Capability | Standard RAG | Lumina |
|---|---|---|
| Cross-reference reasoning | No | Yes |
| Amendment resolution | No | Yes |
| Supersession handling | No | Yes |
| Conflict detection | No | Yes |
| Hybrid search (Vector + BM25) | No (single method) | Yes |
| Source citation | Partial (generic) | Yes (clause-level) |
| Vietnamese regulatory support | Partial (varies) | Yes |

Standard RAG retrieves documents based on semantic similarity alone, treating each document in isolation. This leads to outdated answers, missed cross-references, and undetected conflicts — critical failures in banking compliance. Lumina's Knowledge Graph layer resolves these by modeling document relationships and applying version-aware retrieval.

## Quick Start

```bash
cd solution/ai

pip install -r requirements.txt

cp .env.example .env
# Edit .env with your credentials

python demo.py ingest    # Ingest documents
python demo.py chat      # Interactive chat
python demo.py eval      # Benchmark evaluation
```

## Directory Structure

```
ai/
├── config.py                # Configuration
├── demo.py                  # CLI entry point
├── requirements.txt         # Python dependencies
│
├── rag/                     # Core RAG Pipeline
│   ├── rag_pipeline.py      # Main orchestrator
│   ├── retriever.py         # Hybrid search
│   ├── graph_expander.py    # Graph traversal
│   ├── version_resolver.py  # Version resolution
│   ├── supersession_filter.py # Supersession filtering
│   ├── conflict_detector.py # Conflict detection
│   └── prompt_builder.py    # Prompt construction
│
├── ingestion/               # Document ingestion
│   ├── ingest.py            # Ingestion orchestrator
│   ├── embedder.py          # Embedding service
│   ├── qdrant_indexer.py    # Vector indexing
│   └── neo4j_client.py      # Graph operations
│
├── services/
│   └── llm_service.py       # LLM client
│
├── api/                     # FastAPI backend
├── scripts/                 # Startup scripts
├── tests/                   # Unit tests
└── qdrant_storage/          # Vector data
```

## API

```bash
python scripts/server.py --port 8000
```

## Response Format

```python
@dataclass
class RAGResponse:
    answer: str              # Answer with citations
    sources: list[str]       # Source clause_ids
    conflicts: list[dict]    # Conflict pairs
    reasoning_steps: list[str]  # Reasoning log
    graph: dict | None       # Knowledge graph subgraph
```
