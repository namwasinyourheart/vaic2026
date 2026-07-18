from __future__ import annotations
import json
from pathlib import Path

from neo4j import GraphDatabase

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE


_driver = None


def get_driver():
    global _driver
    if _driver is None:
        _driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    return _driver


def close():
    global _driver
    if _driver:
        _driver.close()
        _driver = None


def clear_database():
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        session.run("MATCH (n) DETACH DELETE n")
    print("Neo4j: database cleared")


def build_graph(graph_json_path: Path, chunks: list):
    driver = get_driver()
    with open(graph_json_path, encoding="utf-8") as f:
        graph = json.load(f)

    chunk_text_map = {c.chunk_id: c.text for c in chunks}

    with driver.session(database=NEO4J_DATABASE) as session:
        # Create indexes for date-based queries
        session.run("CREATE INDEX IF NOT EXISTS FOR (d:Document) ON (d.effective_date)")
        session.run("CREATE INDEX IF NOT EXISTS FOR (d:Document) ON (d.expiry_date)")
        session.run("CREATE INDEX IF NOT EXISTS FOR (c:Clause) ON (c.effective_date)")
        session.run("CREATE INDEX IF NOT EXISTS FOR (c:Clause) ON (c.expiry_date)")

        for node in graph["nodes"]:
            props = dict(node["properties"])
            label = node["labels"][0]

            if label == "Clause" and node["id"] in chunk_text_map:
                props["text"] = chunk_text_map[node["id"]]

            session.run(
                f"MERGE (n:{label} {{id: $id}}) SET n += $props",
                id=node["id"],
                props=props,
            )

        for edge in graph["edges"]:
            rel_type = edge["type"]
            session.run(
                f"MATCH (a {{id: $src}}), (b {{id: $tgt}}) "
                f"MERGE (a)-[r:{rel_type}]->(b)",
                src=edge["source"],
                tgt=edge["target"],
            )

    print(f"Neo4j: created {len(graph['nodes'])} nodes, {len(graph['edges'])} edges")


def get_references(clause_ids: list[str], hops: int = 2) -> set[str]:
    driver = get_driver()
    visited = set(clause_ids)
    frontier = set(clause_ids)

    with driver.session(database=NEO4J_DATABASE) as session:
        for _ in range(hops):
            next_frontier = set()
            for cid in frontier:
                result = session.run(
                    "MATCH (c {id: $cid})-[r:REFERENCES]-(neighbor) "
                    "RETURN neighbor.id AS id",
                    cid=cid,
                )
                for record in result:
                    nid = record["id"]
                    if nid not in visited:
                        visited.add(nid)
                        next_frontier.add(nid)
            frontier = next_frontier
            if not frontier:
                break

    return visited


def get_amended_by(clause_ids: list[str]) -> dict[str, str]:
    driver = get_driver()
    mapping = {}
    with driver.session(database=NEO4J_DATABASE) as session:
        for cid in clause_ids:
            result = session.run(
                "MATCH (newer {id: $cid})-[:AMENDS]->(older) "
                "RETURN older.id AS older_id",
                cid=cid,
            )
            for record in result:
                mapping[record["older_id"]] = cid
    return mapping


def get_superseded_by(clause_ids: list[str]) -> dict[str, str]:
    driver = get_driver()
    mapping = {}
    with driver.session(database=NEO4J_DATABASE) as session:
        for cid in clause_ids:
            result = session.run(
                "MATCH (newer {id: $cid})-[:SUPERSEDES]->(older) "
                "RETURN older.id AS older_id",
                cid=cid,
            )
            for record in result:
                mapping[record["older_id"]] = cid
    return mapping


def get_conflicts(clause_ids: list[str]) -> list[dict[str, str]]:
    driver = get_driver()
    id_set = set(clause_ids)
    conflicts = []
    seen = set()

    with driver.session(database=NEO4J_DATABASE) as session:
        for cid in clause_ids:
            result = session.run(
                "MATCH (a {id: $cid})-[:CONFLICTS_WITH]->(b) "
                "RETURN b.id AS other_id",
                cid=cid,
            )
            for record in result:
                other = record["other_id"]
                if other in id_set:
                    pair = tuple(sorted([cid, other]))
                    if pair not in seen:
                        seen.add(pair)
                        conflicts.append({"clause_a": cid, "clause_b": other})

    return conflicts


def get_active_documents(at_date: str) -> list[dict]:
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        result = session.run(
            "MATCH (d:Document) "
            "WHERE d.effective_date <= $at_date "
            "AND (d.expiry_date IS NULL OR d.expiry_date > $at_date) "
            "RETURN d.document_id AS id, d.title AS title, d.domain AS domain, "
            "d.effective_date AS effective_date, d.expiry_date AS expiry_date",
            at_date=at_date,
        )
        return [dict(record) for record in result]


def get_active_clauses(at_date: str) -> list[dict]:
    driver = get_driver()
    with driver.session(database=NEO4J_DATABASE) as session:
        result = session.run(
            "MATCH (c:Clause)-[:HAS_CLAUSE]-(d:Document) "
            "WHERE coalesce(c.effective_date, d.effective_date) <= $at_date "
            "AND coalesce(c.expiry_date, d.expiry_date, '9999-12-31') > $at_date "
            "RETURN c.clause_id AS id, c.document_id AS document_id, "
            "coalesce(c.effective_date, d.effective_date) AS effective_date, "
            "coalesce(c.expiry_date, d.expiry_date) AS expiry_date",
            at_date=at_date,
        )
        return [dict(record) for record in result]


def get_subgraph(chunk_ids: list[str]) -> dict:
    driver = get_driver()
    nodes = []
    edges = []
    seen_node_ids = set()
    seen_edge_keys = set()

    with driver.session(database=NEO4J_DATABASE) as session:
        # 1. Get Clause nodes
        result = session.run(
            "MATCH (c:Clause) WHERE c.clause_id IN $ids "
            "RETURN c.clause_id AS id, c.document_id AS document_id, "
            "c.text AS text, c.effective_date AS effective_date, "
            "c.expiry_date AS expiry_date",
            ids=chunk_ids,
        )
        for record in result:
            nid = record["id"]
            if nid not in seen_node_ids:
                seen_node_ids.add(nid)
                nodes.append({
                    "id": nid,
                    "type": "Clause",
                    "label": nid,
                    "document_id": record["document_id"],
                    "text": (record["text"] or "")[:200],
                    "effective_date": record["effective_date"],
                    "expiry_date": record["expiry_date"],
                })

        # 2. Get parent Document nodes
        result = session.run(
            "MATCH (c:Clause)-[:HAS_CLAUSE]-(d:Document) "
            "WHERE c.clause_id IN $ids "
            "RETURN DISTINCT d.document_id AS id, d.title AS title, "
            "d.domain AS domain, d.type AS doc_type, "
            "d.effective_date AS effective_date, d.expiry_date AS expiry_date",
            ids=chunk_ids,
        )
        for record in result:
            nid = record["id"]
            if nid not in seen_node_ids:
                seen_node_ids.add(nid)
                nodes.append({
                    "id": nid,
                    "type": "Document",
                    "label": record["title"] or nid,
                    "domain": record["domain"],
                    "doc_type": record["doc_type"],
                    "effective_date": record["effective_date"],
                    "expiry_date": record["expiry_date"],
                })

        # 3. Get parent Domain nodes
        result = session.run(
            "MATCH (c:Clause)-[:HAS_CLAUSE]-(d:Document)-[:HAS_DOCUMENT]-(dom:Domain) "
            "WHERE c.clause_id IN $ids "
            "RETURN DISTINCT dom.domain_id AS id, dom.name AS name",
            ids=chunk_ids,
        )
        for record in result:
            nid = record["id"]
            if nid not in seen_node_ids:
                seen_node_ids.add(nid)
                nodes.append({
                    "id": nid,
                    "type": "Domain",
                    "label": record["name"] or nid,
                })

        # 4. Get edges between these nodes
        result = session.run(
            "MATCH (a)-[r]->(b) "
            "WHERE a.id IN $ids AND b.id IN $ids "
            "RETURN a.id AS source, b.id AS target, type(r) AS type",
            ids=list(seen_node_ids),
        )
        for record in result:
            edge_key = (record["source"], record["target"], record["type"])
            if edge_key not in seen_edge_keys:
                seen_edge_keys.add(edge_key)
                edges.append({
                    "source": record["source"],
                    "target": record["target"],
                    "type": record["type"],
                })

    return {"nodes": nodes, "edges": edges}
