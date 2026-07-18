"""
Step 1: Generate metadata + graph JSON from knowledge_universe definitions.
No LLM calls needed — pure structural output.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from knowledge_universe import DOMAINS, DOCUMENTS, RELATIONSHIPS, build_clause_list
from utils import save_json, ensure_dirs
from config import METADATA_DIR, GRAPH_DIR, OUTPUT_DIR


def generate_documents_metadata() -> list[dict]:
    docs = []
    for doc in DOCUMENTS:
        clauses_in_doc = [
            c for c in build_clause_list() if c["document_id"] == doc["document_id"]
        ]
        docs.append({
            "document_id": doc["document_id"],
            "title": doc["title"],
            "title_en": doc["title_en"],
            "domain": doc["domain"],
            "type": doc["type"],
            "version": doc["version"],
            "effective_date": doc["effective_date"],
            "expiry_date": doc.get("expiry_date"),
            "status": doc["status"],
            "language": doc["language"],
            "access_level": doc["access_level"],
            "owner_department": doc["owner_department"],
            "summary": doc["summary"],
            "sections": doc["sections"],
            "clause_count": len(clauses_in_doc),
            "clause_ids": [c["clause_id"] for c in clauses_in_doc],
        })
    return docs


def generate_clauses_metadata() -> list[dict]:
    clauses = build_clause_list()
    rels = RELATIONSHIPS

    for clause in clauses:
        cid = clause["clause_id"]
        clause["references"] = [r[1] for r in rels["references"] if r[0] == cid]
        clause["referenced_by"] = [r[0] for r in rels["references"] if r[1] == cid]
        clause["amends"] = [r[1] for r in rels["amends"] if r[0] == cid]
        clause["amended_by"] = [r[0] for r in rels["amends"] if r[1] == cid]
        clause["supersedes"] = [r[1] for r in rels["supersedes"] if r[0] == cid]
        clause["superseded_by"] = [r[0] for r in rels["supersedes"] if r[1] == cid]
        clause["conflicts_with"] = [r[1] for r in rels["conflicts_with"] if r[0] == cid]
    return clauses


def generate_graph_metadata() -> dict:
    nodes = []
    edges = []

    # Domain nodes
    for d in DOMAINS:
        nodes.append({"id": d["domain_id"], "type": "Domain", "label": d["name"]})

    # Document nodes
    for doc in DOCUMENTS:
        nodes.append({
            "id": doc["document_id"],
            "type": "Document",
            "label": doc["title"],
            "domain": doc["domain"],
            "doc_type": doc["type"],
            "version": doc["version"],
            "effective_date": doc["effective_date"],
            "expiry_date": doc.get("expiry_date"),
        })
        # HAS_DOCUMENT edge
        edges.append({
            "source": doc["domain"],
            "target": doc["document_id"],
            "type": "HAS_DOCUMENT",
        })

    # Version chain edges
    for newer, older in RELATIONSHIPS["version_chain"]:
        edges.append({"source": newer, "target": older, "type": "REPLACES"})
        edges.append({"source": older, "target": newer, "type": "REPLACED_BY"})

    # Clause nodes + structural edges
    for clause in build_clause_list():
        nodes.append({
            "id": clause["clause_id"],
            "type": "Clause",
            "document_id": clause["document_id"],
            "status": clause["status"],
            "effective_date": clause.get("effective_date"),
            "expiry_date": clause.get("expiry_date"),
        })
        # HAS_CLAUSE edge from document
        edges.append({
            "source": clause["document_id"],
            "target": clause["clause_id"],
            "type": "HAS_CLAUSE",
        })

    # Relationship edges
    for rel_type in ["references", "amends", "supersedes", "conflicts_with"]:
        for src, tgt in RELATIONSHIPS[rel_type]:
            edge_type = {
                "references": "REFERENCES",
                "amends": "AMENDS",
                "supersedes": "SUPERSEDES",
                "conflicts_with": "CONFLICTS_WITH",
            }[rel_type]
            edges.append({"source": src, "target": tgt, "type": edge_type})

    return {"nodes": nodes, "edges": edges}


def generate_knowledge_graph() -> dict:
    """Neo4j-importable format."""
    graph = generate_graph_metadata()
    nodes = []
    for n in graph["nodes"]:
        if n["type"] == "Domain":
            nodes.append({
                "id": n["id"],
                "labels": ["Domain"],
                "properties": {"domain_id": n["id"], "name": n["label"]},
            })
        elif n["type"] == "Document":
            nodes.append({
                "id": n["id"],
                "labels": ["Document"],
                "properties": {
                    "document_id": n["id"],
                    "title": n["label"],
                    "domain": n["domain"],
                    "type": n["doc_type"],
                    "version": n["version"],
                    "effective_date": n.get("effective_date"),
                    "expiry_date": n.get("expiry_date"),
                },
            })
        elif n["type"] == "Clause":
            nodes.append({
                "id": n["id"],
                "labels": ["Clause"],
                "properties": {
                    "clause_id": n["id"],
                    "document_id": n["document_id"],
                    "status": n["status"],
                    "effective_date": n.get("effective_date"),
                    "expiry_date": n.get("expiry_date"),
                },
            })

    edges = []
    for e in graph["edges"]:
        edges.append({
            "source": e["source"],
            "target": e["target"],
            "type": e["type"],
        })

    return {"nodes": nodes, "edges": edges}


def main():
    ensure_dirs()

    print("=== Step 1: Generate Structure ===")

    print("\n[1/4] Documents metadata...")
    docs_meta = generate_documents_metadata()
    save_json(docs_meta, METADATA_DIR / "documents.json")

    print("[2/4] Clauses metadata...")
    clauses_meta = generate_clauses_metadata()
    save_json(clauses_meta, METADATA_DIR / "clauses.json")

    print("[3/4] Graph metadata...")
    graph_meta = generate_graph_metadata()
    save_json(graph_meta, METADATA_DIR / "graph.json")

    print("[4/4] Knowledge graph (Neo4j format)...")
    kg = generate_knowledge_graph()
    save_json(kg, GRAPH_DIR / "knowledge_graph.json")

    # Summary
    n_docs = len(DOCUMENTS)
    n_clauses = len(clauses_meta)
    n_refs = len(RELATIONSHIPS["references"])
    n_amends = len(RELATIONSHIPS["amends"])
    n_supersedes = len(RELATIONSHIPS["supersedes"])
    n_conflicts = len(RELATIONSHIPS["conflicts_with"])
    n_nodes = len(kg["nodes"])
    n_edges = len(kg["edges"])

    print(f"\n=== Summary ===")
    print(f"Domains:    {len(DOMAINS)}")
    print(f"Documents:  {n_docs}")
    print(f"Clauses:    {n_clauses}")
    print(f"References: {n_refs}")
    print(f"Amends:     {n_amends}")
    print(f"Supersedes: {n_supersedes}")
    print(f"Conflicts:  {n_conflicts}")
    print(f"Graph:      {n_nodes} nodes, {n_edges} edges")
    print(f"\nOutput: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
