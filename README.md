# Lumina – AI-Powered Regulatory Intelligence for Banking

## Executive Summary

Lumina is an AI-native knowledge intelligence platform that enables SHB Bank to search and understand complex banking knowledge using natural language. The platform uses a Knowledge Graph (Neo4j) + Hybrid RAG Pipeline to handle four critical regulatory capabilities that traditional RAG systems cannot: cross-reference reasoning, amendment resolution, partial supersession handling, and conflict detection.

---

# Problem Statement

## Current Challenges

- **Outdated regulations:** Traditional RAG systems answer based on the oldest version, without distinguishing amended or superseded documents.
- **Lost cross-document context:** When one clause references another document, traditional RAG does not automatically expand context, leading to incomplete answers.
- **Undetected conflicts:** Multiple regulations may apply to the same situation, but the system cannot detect and warn users.
- **Inaccurate search:** Using only vector search or keyword search alone is insufficient for banking regulatory documents that require both semantic and lexical matching.

### Current Approaches and Their Limitations

**No RAG — Manual search:**
```
Employee needs to look up a regulation
        ↓
Search manually across PDF/Word documents
        ↓
Must determine which version is still effective
        ↓
Cannot detect conflicts between regulations
        ↓
Risk of using wrong regulation → Fines / Reputation loss
```

**Standard RAG — Semantic search only:**
```
Employee asks a question
        ↓
Vector search finds similar text passages
        ↓
LLM generates an answer from retrieved chunks
        ↓
But: outdated versions, missing cross-references,
     superseded clauses, undetected conflicts
        ↓
Confident-sounding answer that may be legally wrong
```

**Lumina — Knowledge Graph + Hybrid RAG:**
```
Employee asks a question
        ↓
Hybrid search (Vector + BM25 + RRF)
        ↓
Graph expansion via cross-references
        ↓
Version resolution (latest effective only)
        ↓
Supersession filter (remove replaced clauses)
        ↓
Conflict detection and warning
        ↓
Grounded answer with clause-level citations
```

---

# Solution Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│            Customer · Staff · Compliance Officer · Admin         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    Backend (FastAPI)                             │
│  Auth · Documents · Conversations · Knowledge · Admin · Audit   │
│                     Internal API → AI Service                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    AI / RAG Service                              │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Vector Store │  │ Knowledge    │  │ LLM Generation        │  │
│  │ (Qdrant)     │  │ Graph        │  │                       │  │
│  │              │  │ (Neo4j)      │  │  Evidence-bound       │  │
│  │  Hybrid      │  │              │  │  + Citations          │  │
│  │  Search      │  │  References  │  │  + Conflict Warning   │  │
│  │  (Vector +   │  │  Amends      │  │                       │  │
│  │   BM25 +     │  │  Supersedes  │  └───────────────────────┘  │
│  │   RRF)       │  │  Conflicts   │                             │
│  └─────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

## Three-Service Architecture

| Service | Responsibility | Tech |
|---|---|---|
| **Frontend** | UI for 4 roles: Customer, Staff, Compliance Officer, Admin | React, TypeScript, Vite, Tailwind CSS |
| **Backend** | Auth, authorization, document management, conversation history, audit log | FastAPI, SQLAlchemy, PostgreSQL, Alembic |
| **AI Service** | RAG Pipeline, Knowledge Graph, Vector Search, LLM Generation | Qdrant, Neo4j, Sentence Transformers, OpenRouter |

Benefits of separation:
- AI Service can be upgraded or swapped without affecting Backend.
- Backend ensures every request passes auth + permission checks before touching AI data.
- Mock AI adapter allows full business workflows to operate even when the real AI is not yet available.

---

# AI Pipeline

```
User Query
    │
    ▼
┌─────────────────────────┐
│  1. Hybrid Search       │  Vector + BM25 + RRF Fusion
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│  2. Graph Expansion     │  Neo4j BFS (REFERENCES)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│  3. Version Resolution  │  AMENDS chain → latest version
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│  4. Supersession Filter │  SUPERSEDES → remove old
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│  5. Conflict Detection  │  CONFLICTS_WITH → warning
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│  6. LLM Generation      │  Evidence-bound + Citations
└───────────┬─────────────┘
            ▼
       RAGResponse
   (answer, sources, conflicts, graph)
```

4 relationship types in the Knowledge Graph:

| Relationship | Purpose |
|---|---|
| `REFERENCES` | Cross-reference between documents |
| `AMENDS` | Regulation amendment → version chain |
| `SUPERSEDES` | Full replacement → remove old |
| `CONFLICTS_WITH` | Conflict → warn user |

---

# Frontend

React SPA with 4 role-based workspaces:

| Display Name | Stable Code | Workspace | Key Features |
|---|---|---|---|
| **Customer** | `ROLE_CUSTOMER` | `/customer/*` | Chat, conversation history, account management |
| **Staff** | `ROLE_STAFF` | `/staff/*` | Chat, document search, clause search, version comparison, timeline |
| **Compliance Officer** | `ROLE_COMPLIANCE` | `/compliance/*` | Upload documents, manage metadata, relations, conflicts, re-index |
| **System Admin** | `ROLE_ADMIN` | `/admin/*` | User management, roles, permissions, audit log |

### Routes

```
/                          → Redirect to role workspace
/login                     → Login
/register                  → Customer registration

/customer/chat             → Customer Chat
/customer/history          → Conversation history

/staff/chat        → Staff Chat
/staff/documents   → Document search
/staff/clauses     → Clause search
/staff/compare     → Version comparison
/staff/timeline    → Amendment timeline
/staff/relations   → Related documents

/compliance/dashboard  → Compliance Dashboard
/compliance/upload     → Upload documents
/compliance/metadata   → Metadata management
/compliance/relations  → Document relations
/compliance/reindex    → Re-index

/admin/dashboard           → Admin Dashboard
/admin/users               → User management
/admin/roles               → Role management
/admin/logs                → Audit log
```

---

# Backend

FastAPI backend responsible for: authentication, authorization, document metadata management, file storage, conversation history, audit log.

### Roles

| Display Name | Stable Code | Scope |
|---|---|---|
| Customer | `ROLE_CUSTOMER` | Public data and own conversations |
| Staff | `ROLE_STAFF` | Internal staff retrieval and document reading |
| Compliance Officer | `ROLE_COMPLIANCE` | Document lifecycle, metadata, relations, and re-indexing |
| System Admin | `ROLE_ADMIN` | Users, roles, permissions, and audit logs |

### API Groups

| Group | Prefix | Purpose |
|---|---|---|
| Auth | `/api/v1/auth` | Login, signup, refresh, logout, profile, password |
| Conversations | `/api/v1/conversations` | Conversation CRUD, messages |
| Documents | `/api/v1/documents` | Search, detail, versions, clauses, graphs |
| Knowledge | `/api/v1/knowledge` | Upload, metadata, relations, conflicts, re-index |
| Admin | `/api/v1/admin` | Users, roles, permissions, audit logs |

### Security

- bcrypt password hashing
- JWT access tokens + rotating refresh tokens
- Permission checks at Backend (not Frontend)
- Audit log for all sensitive operations

---

# Repository Structure

```
solution/
├── README.md
│
├── ai/                        # AI / RAG Service
│   ├── config.py              # Configuration
│   ├── demo.py                # CLI (ingest / chat / eval)
│   ├── rag/                   # Core RAG Pipeline
│   │   ├── rag_pipeline.py    # Main orchestrator
│   │   ├── retriever.py       # Hybrid search
│   │   ├── graph_expander.py  # Graph traversal
│   │   ├── version_resolver.py
│   │   ├── supersession_filter.py
│   │   ├── conflict_detector.py
│   │   └── prompt_builder.py
│   ├── ingestion/             # Document ingestion
│   ├── services/              # LLM client
│   ├── api/                   # FastAPI endpoints
│   └── tests/                 # Unit tests
│       ├── test_rag_pipeline.py
│       ├── test_prompt_builder.py
│       ├── test_clause_parser.py
│       ├── test_base_parser.py
│       └── test_api.py
│
├── backend/                   # Backend Service
│   ├── app/
│   │   ├── api/v1/            # Auth, documents, knowledge, admin...
│   │   ├── services/          # Security, storage, AI adapter
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── main.py            # FastAPI app
│   │   └── seed.py            # Demo data
│   ├── migrations/            # Alembic
│   └── tests/
│
└── frontend/                  # Frontend (React)
    ├── src/
    │   ├── pages/             # Customer, Staff, Compliance, Admin pages
    │   ├── auth/              # Auth context, route guards
    │   ├── components/        # Shared UI components
    │   ├── services/          # API client
    │   └── App.tsx            # Routes
    └── package.json
```

---

# Data Preparation

Documents are crawled from two primary sources:

- **vbpl.vn** — Vietnam's national legal database (Thông tư, Nghị định, Quyết định from SBV, Government, and other authorities)
- **SHB Bank website** — Internal policies, operating procedures, contract templates, and institutional knowledge

Crawled documents are parsed into clause-level chunks, embedded, and indexed into both Qdrant (vector store) and Neo4j (knowledge graph with REFERENCES, AMENDS, SUPERSEDES, CONFLICTS_WITH relationships).

---

# Benchmark

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

---

# Quick Start

## Prerequisites

- Python 3.11+
- Node.js 22+
- PostgreSQL (or SQLite for tests)
- Neo4j AuraDB instance
- OpenRouter API key

## Backend

```bash
cd solution/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

## Frontend

```bash
cd solution/frontend
npm install
npm run dev -- --port 8443
```

Open `http://localhost:8443`

## AI Service

```bash
cd solution/ai
pip install -r requirements.txt
cp .env.example .env
python demo.py ingest
python demo.py chat
```

## Tests

```bash
# Backend
cd solution/backend
pytest

# AI
cd solution/ai
pytest

# Frontend
cd solution/frontend
npm run typecheck
npm run build
```

---

# Deployment

| Service | Platform | URL |
|---|---|---|
| Backend | Render Web Service | `https://vaic2026.onrender.com` |
| Frontend | Render Static Site | `https://vaic2026.onrender.com` |

---

# AI-Native Features

- Multi-step reasoning (6-step pipeline)
- Knowledge Graph reasoning (Neo4j BFS, version resolution, supersession)
- Hybrid Search (Vector + BM25 + RRF)
- RAG (Retrieve → Expand → Resolve → Filter → Detect → Generate)
- Grounding (evidence-bound generation)
- Citation (clause_id + document_id)
- Conflict Detection (auto-detect + warning)
- Version Awareness (latest version only)
- Hallucination mitigation
- Source inspection (retrieval graph visualization)

---

# Business Impact

- **Search time reduction:** 30-60 minutes manual → 3-6 seconds
- **Compliance assurance:** Always use the latest effective version
- **Conflict detection:** Automatic warnings for conflicting regulations
- **Labor savings:** 2-3 hours/day for compliance teams
- **Faster onboarding**
- **Standardized organizational knowledge**
