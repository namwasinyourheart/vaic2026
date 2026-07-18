#!/usr/bin/env python3
"""
Generate benchmark dataset (100 questions/answers) from VBPLVN dataset using OpenRouter LLM.

Distribution: 18 easy (simple_retrieval), 42 medium (cross_reference + amendment), 40 hard (supersession + conflict + multi_hop)

Usage:
    python generate_vbplvn_benchmark.py
"""

import json
import os
import csv
import re
import sys
import time
import random
from pathlib import Path
from collections import defaultdict
from datetime import datetime

# Add parent to path for config
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "solution" / "ai"))
from config import OPENROUTER_API_KEY, LLM_MODEL, LLM_BASE_URL

# Paths
VBPLVN_DIR = Path(__file__).parent.parent / "output" / "vbplvn"
DATA_DIR = VBPLVN_DIR / "data"
CSV_PATH = VBPLVN_DIR / "danh_sach_1000_van_ban.csv"
BENCHMARK_DIR = VBPLVN_DIR / "benchmark"

# LLM call via OpenRouter
import requests

def call_llm(prompt: str, system: str = "Bạn là chuyên gia pháp lý Việt Nam.", temperature: float = 0.7, max_tokens: int = 4096) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    for attempt in range(3):
        try:
            resp = requests.post(f"{LLM_BASE_URL}/chat/completions", headers=headers, json=payload, timeout=120)
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"  LLM call failed (attempt {attempt+1}): {e}")
            time.sleep(2 ** attempt)
    return ""


def extract_vbpl_id(url: str) -> str | None:
    m = re.search(r'doc--([a-f0-9-]+)', url)
    return m.group(1) if m else None


def build_dataset():
    """Load documents, clauses, and internal relations from VBPLVN."""
    
    # Read CSV catalog
    csv_by_id = {}
    with open(CSV_PATH, newline='', encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            csv_by_id[row['id']] = row
    
    # Internal graph
    graph = defaultdict(lambda: defaultdict(list))  # source -> {target: [relation_types]}
    doc_metadata = {}
    
    for doc_dir in sorted(os.listdir(DATA_DIR)):
        dir_path = DATA_DIR / doc_dir
        if not dir_path.is_dir():
            continue
        meta_path = dir_path / "metadata.json"
        clauses_path = dir_path / "clauses.json"
        fulltext_path = dir_path / "full_text.md"
        
        if not meta_path.exists():
            continue
        
        meta = json.loads(meta_path.read_text(encoding='utf-8'))
        doc_id = doc_dir
        
        # Load clauses
        clauses = {}
        if clauses_path.exists():
            clauses = json.loads(clauses_path.read_text(encoding='utf-8'))
        
        # Load full text (truncated for prompt)
        full_text = ""
        if fulltext_path.exists():
            full_text = fulltext_path.read_text(encoding='utf-8')
        
        # Build clause list
        clause_list = []
        for key, text in clauses.items():
            if isinstance(text, str) and text.strip():
                clause_list.append({
                    "clause_id": f"{doc_id}/{key}",
                    "key": key,
                    "text": text[:500]  # truncate for LLM context
                })
        
        doc_metadata[doc_id] = {
            "doc_id": doc_id,
            "doc_number": meta.get("doc_number", ""),
            "title": meta.get("title", ""),
            "doc_type": meta.get("doc_type", ""),
            "agency": meta.get("agency", ""),
            "issue_date": meta.get("issue_date", ""),
            "effective_date": meta.get("effective_date", ""),
            "expire_date": meta.get("expire_date", ""),
            "status": meta.get("status", ""),
            "industry": meta.get("industry", ""),
            "field": meta.get("field", ""),
            "clause_count": len(clause_list),
            "clauses": clause_list,
            "full_text_length": len(full_text),
        }
        
        # Build graph
        rels = meta.get("relations", {})
        for rel_type, targets in rels.items():
            for target in targets:
                linked_id = extract_vbpl_id(target.get("url", ""))
                if linked_id and linked_id in csv_by_id:
                    rel_code = "REFERENCES"
                    rl = rel_type.lower()
                    if "sửa đổi" in rl or "bổ sung" in rl:
                        rel_code = "AMENDS"
                    elif "thay thế" in rl or "bãi bỏ" in rl:
                        rel_code = "SUPERSEDES"
                    elif "hợp nhất" in rl:
                        rel_code = "CONSOLIDATES"
                    graph[doc_id][linked_id].append(rel_code)
    
    return doc_metadata, dict(graph)


def get_key_docs(doc_metadata, graph):
    """Get docs usable for benchmark generation (have clauses + have relations)."""
    amend_docs = set()
    supersede_docs = set()
    
    for sid, targets in graph.items():
        for tid, types in targets.items():
            for t in types:
                if t == "AMENDS": amend_docs.add(sid); amend_docs.add(tid)
                elif t == "SUPERSEDES": supersede_docs.add(sid); supersede_docs.add(tid)
    
    key_ids = set(amend_docs | supersede_docs)
    valid = {}
    for did in key_ids:
        if did in doc_metadata and doc_metadata[did]["clause_count"] > 0:
            valid[did] = doc_metadata[did]
    return valid, amend_docs, supersede_docs


def build_context_text(doc, max_len=3000):
    """Build a brief text describing a document for LLM context."""
    parts = [
        f"Số hiệu: {doc['doc_number']}",
        f"Tiêu đề: {doc['title']}",
        f"Loại: {doc['doc_type']}",
        f"Cơ quan: {doc['agency']}",
        f"Ngày ban hành: {doc['issue_date']}",
        f"Ngày hiệu lực: {doc['effective_date']}",
        f"Tình trạng: {doc['status']}",
        f"Số điều khoản: {doc['clause_count']}",
    ]
    # Add first few clauses
    clause_texts = []
    for c in doc["clauses"][:10]:
        clause_texts.append(f"  {c['key']}: {c['text'][:200]}")
    if clause_texts:
        parts.append("Các điều khoản chính:")
        parts.extend(clause_texts)
    return "\n".join(parts)[:max_len]


def generate_easy_questions(doc_metadata, n=18):
    """Generate simple_retrieval questions - each maps to a single clause."""
    print(f"\n{'='*60}")
    print(f"Generating {n} easy (simple_retrieval) questions...")
    print(f"{'='*60}")
    
    questions = []
    candidates = list(doc_metadata.values())
    random.shuffle(candidates)
    
    for i, doc in enumerate(candidates[:n]):
        if not doc["clauses"]:
            continue
        
        clause = random.choice(doc["clauses"])
        clause_key = clause["key"]
        clause_text = clause["text"][:300]
        
        prompt = f"""
Bạn là chuyên gia pháp lý Việt Nam. Hãy đọc văn bản pháp luật sau và tạo MỘT câu hỏi về điều khoản được đánh dấu.

Văn bản:
Số hiệu: {doc['doc_number']}
Tiêu đề: {doc['title']}
Loại: {doc['doc_type']}
Cơ quan: {doc['agency']}
Lĩnh vực: {doc['field']}

Điều khoản cần hỏi ({clause_key}):
{clause_text}

Yêu cầu:
- Tạo câu hỏi bằng tiếng Việt, dạng đơn giản, người dùng hỏi chatbot
- Câu hỏi phải có câu trả lời CHỈ từ điều khoản này (single-clause lookup)
- Câu hỏi phải cụ thể, không chung chung
- Kèm theo câu trả lời mẫu và clause_id

Trả lời CHỈ ĐÚNG định dạng JSON:
{{
  "question": "...",
  "expected_answer": "...",
  "source_clause_id": "{clause['clause_id']}",
  "reasoning": "Direct single-clause lookup from hybrid search"
}}
"""
        
        result = call_llm(prompt, "Bạn là chuyên gia pháp lý Việt Nam tạo câu hỏi benchmark.", temperature=0.8)
        print(f"  [{i+1}/{n}] {doc['doc_number'][:20]} | {clause_key}")
        
        try:
            q = json.loads(result.strip().strip("```json").strip("```").strip())
            questions.append({
                "question_id": f"E{i+1:03d}",
                "question": q["question"],
                "question_type": "simple_retrieval",
                "difficulty": "easy",
                "expected_answer": q["expected_answer"],
                "source_clause_ids": [q["source_clause_id"]],
                "source_document_ids": [doc["doc_id"]],
                "reasoning_required": "Direct single-clause lookup from hybrid search"
            })
        except:
            # Manual fallback
            questions.append({
                "question_id": f"E{i+1:03d}",
                "question": f"Quy định tại {clause_key} của {doc['doc_number']} là gì?",
                "question_type": "simple_retrieval",
                "difficulty": "easy",
                "expected_answer": clause_text[:200],
                "source_clause_ids": [clause["clause_id"]],
                "source_document_ids": [doc["doc_id"]],
                "reasoning_required": "Direct single-clause lookup from hybrid search"
            })
    
    return questions


def generate_medium_questions(doc_metadata, graph, n=42):
    """Generate cross_reference (22) + amendment (20) questions."""
    print(f"\n{'='*60}")
    print(f"Generating {n} medium questions (cross_ref + amendment)...")
    print(f"{'='*60}")
    
    questions = []
    
    # Part 1: Cross-reference questions (22)
    print(f"\n--- Cross-reference (22) ---")
    cross_ref_pairs = []
    for sid, targets in graph.items():
        for tid, types in targets.items():
            if "REFERENCES" in types and sid in doc_metadata and tid in doc_metadata:
                cross_ref_pairs.append((sid, tid, "REFERENCES"))
                if len(cross_ref_pairs) >= 30:
                    break
        if len(cross_ref_pairs) >= 30:
            break
    
    for i, (sid, tid, rel_type) in enumerate(cross_ref_pairs[:22]):
        src_doc = doc_metadata[sid]
        tgt_doc = doc_metadata[tid]
        src_clause = random.choice(src_doc["clauses"]) if src_doc["clauses"] else None
        tgt_clause = random.choice(tgt_doc["clauses"]) if tgt_doc["clauses"] else None
        
        if not src_clause or not tgt_clause:
            continue
        
        prompt = f"""
Bạn là chuyên gia pháp lý Việt Nam. Hai văn bản sau có quan hệ THAM CHIẾU với nhau.

Văn bản A (nguồn):
{src_doc['doc_number']} - {src_doc['title'][:100]}
{src_doc['doc_type']} do {src_doc['agency']} ban hành
Điều khoản: {src_clause['key']}: {src_clause['text'][:300]}

Văn bản B (được tham chiếu):
{tgt_doc['doc_number']} - {tgt_doc['title'][:100]}
{tgt_doc['doc_type']} do {tgt_doc['agency']} ban hành
Điều khoản: {tgt_clause['key']}: {tgt_clause['text'][:300]}

Hãy tạo MỘT câu hỏi mà người dùng cần kết hợp cả hai điều khoản từ hai văn bản để trả lời.

Trả lời JSON:
{{
  "question": "...",
  "expected_answer": "...",
  "source_clause_ids": ["{src_clause['clause_id']}", "{tgt_clause['clause_id']}"],
  "reasoning": "Follow REFERENCES link from source clause to target clause across documents"
}}
"""
        
        result = call_llm(prompt, temperature=0.8)
        print(f"  [{i+1}/22] {src_doc['doc_number'][:20]} -> {tgt_doc['doc_number'][:20]}")
        
        try:
            q = json.loads(result.strip().strip("```json").strip("```").strip())
            questions.append({
                "question_id": f"M{i+1:03d}",
                "question": q["question"],
                "question_type": "cross_reference",
                "difficulty": "medium",
                "expected_answer": q["expected_answer"],
                "source_clause_ids": q["source_clause_ids"],
                "source_document_ids": [sid, tid],
                "reasoning_required": "Follow REFERENCES link from source clause to target clause across documents"
            })
        except:
            questions.append({
                "question_id": f"M{i+1:03d}",
                "question": f"{src_doc['doc_number']} tại {src_clause['key']} tham chiếu đến quy định nào của {tgt_doc['doc_number']}?",
                "question_type": "cross_reference",
                "difficulty": "medium",
                "expected_answer": f"{src_doc['doc_number']} {src_clause['key']} tham chiếu đến {tgt_doc['doc_number']} {tgt_clause['key']}: {tgt_clause['text'][:200]}",
                "source_clause_ids": [src_clause["clause_id"], tgt_clause["clause_id"]],
                "source_document_ids": [sid, tid],
                "reasoning_required": "Follow REFERENCES link from source clause to target clause across documents"
            })
    
    # Part 2: Amendment questions (20)
    print(f"\n--- Amendment (20) ---")
    amend_pairs = []
    for sid, targets in graph.items():
        for tid, types in targets.items():
            if "AMENDS" in types and sid in doc_metadata and tid in doc_metadata:
                amend_pairs.append((sid, tid, "AMENDS"))
                if len(amend_pairs) >= 25:
                    break
        if len(amend_pairs) >= 25:
            break
    
    base_idx = 22
    for i, (sid, tid, rel_type) in enumerate(amend_pairs[:20]):
        src_doc = doc_metadata[sid]
        tgt_doc = doc_metadata[tid]
        src_clause = random.choice(src_doc["clauses"]) if src_doc["clauses"] else None
        tgt_clause = random.choice(tgt_doc["clauses"]) if tgt_doc["clauses"] else None
        
        if not src_clause or not tgt_clause:
            continue
        
        prompt = f"""
Bạn là chuyên gia pháp lý Việt Nam. Văn bản sau có quan hệ SỬA ĐỔI, BỔ SUNG văn bản kia.

Văn bản sửa đổi (mới hơn):
{src_doc['doc_number']} - {src_doc['title'][:100]}
Điều khoản sửa đổi: {src_clause['key']}: {src_clause['text'][:300]}

Văn bản bị sửa đổi (cũ hơn):
{tgt_doc['doc_number']} - {tgt_doc['title'][:100]}
Điều khoản bị sửa: {tgt_clause['key']}: {tgt_clause['text'][:300]}

Hãy tạo MỘT câu hỏi yêu cầu người dùng xác định quy định MỚI NHẤT sau khi có sửa đổi.

Trả lời JSON:
{{
  "question": "...",
  "expected_answer": "...",
  "source_clause_ids": ["{src_clause['clause_id']}", "{tgt_clause['clause_id']}"],
  "reasoning": "Must resolve latest version: check AMENDS chain, use the newer document version"
}}
"""
        
        result = call_llm(prompt, temperature=0.8)
        print(f"  [{i+1}/20] {src_doc['doc_number'][:20]} amends {tgt_doc['doc_number'][:20]}")
        
        try:
            q = json.loads(result.strip().strip("```json").strip("```").strip())
            questions.append({
                "question_id": f"M{base_idx+i+1:03d}",
                "question": q["question"],
                "question_type": "amendment",
                "difficulty": "medium",
                "expected_answer": q["expected_answer"],
                "source_clause_ids": q["source_clause_ids"],
                "source_document_ids": [sid, tid],
                "reasoning_required": "Must resolve latest version: check AMENDS chain, use the newer document version"
            })
        except:
            questions.append({
                "question_id": f"M{base_idx+i+1:03d}",
                "question": f"Quy định tại {tgt_clause['key']} của {tgt_doc['doc_number']} đã được {src_doc['doc_number']} sửa đổi như thế nào?",
                "question_type": "amendment",
                "difficulty": "medium",
                "expected_answer": f"{src_doc['doc_number']} {src_clause['key']} sửa đổi {tgt_doc['doc_number']} {tgt_clause['key']}. Nội dung mới: {src_clause['text'][:200]}",
                "source_clause_ids": [src_clause["clause_id"], tgt_clause["clause_id"]],
                "source_document_ids": [sid, tid],
                "reasoning_required": "Must resolve latest version: check AMENDS chain, use the newer document version"
            })
    
    return questions


def generate_hard_questions(doc_metadata, graph, n=40):
    """Generate supersession (15) + conflict (15) + multi_hop (10) questions."""
    print(f"\n{'='*60}")
    print(f"Generating {n} hard questions (supersession + conflict + multi_hop)...")
    print(f"{'='*60}")
    
    questions = []
    
    # Part 1: Supersession (15)
    print(f"\n--- Supersession (15) ---")
    supersede_pairs = []
    for sid, targets in graph.items():
        for tid, types in targets.items():
            if "SUPERSEDES" in types and sid in doc_metadata and tid in doc_metadata:
                supersede_pairs.append((sid, tid, "SUPERSEDES"))
                if len(supersede_pairs) >= 20:
                    break
        if len(supersede_pairs) >= 20:
            break
    
    for i, (sid, tid, rel_type) in enumerate(supersede_pairs[:15]):
        src_doc = doc_metadata[sid]
        tgt_doc = doc_metadata[tid]
        src_clause = random.choice(src_doc["clauses"]) if src_doc["clauses"] else None
        tgt_clause = random.choice(tgt_doc["clauses"]) if tgt_doc["clauses"] else None
        
        if not src_clause or not tgt_clause:
            continue
        
        prompt = f"""
Bạn là chuyên gia pháp lý Việt Nam. Văn bản sau có quan hệ THAY THẾ văn bản kia.

Văn bản thay thế (mới):
{src_doc['doc_number']} - {src_doc['title'][:100]}
Điều khoản mới: {src_clause['key']}: {src_clause['text'][:300]}

Văn bản bị thay thế (cũ, hết hiệu lực):
{tgt_doc['doc_number']} - {tgt_doc['title'][:100]}
Điều khoản cũ: {tgt_clause['key']}: {tgt_clause['text'][:300]}

Hãy tạo MỘT câu hỏi yêu cầu xác định điều khoản nào đã hết hiệu lực và điều khoản mới nào thay thế.

Trả lời JSON:
{{
  "question": "...",
  "expected_answer": "...",
  "source_clause_ids": ["{src_clause['clause_id']}", "{tgt_clause['clause_id']}"],
  "reasoning": "Must identify SUPERSEDES relationships and determine which clauses are still active"
}}
"""
        
        result = call_llm(prompt, temperature=0.8)
        print(f"  [{i+1}/15] {src_doc['doc_number'][:20]} supersedes {tgt_doc['doc_number'][:20]}")
        
        try:
            q = json.loads(result.strip().strip("```json").strip("```").strip())
            questions.append({
                "question_id": f"H{i+1:03d}",
                "question": q["question"],
                "question_type": "supersession",
                "difficulty": "hard",
                "expected_answer": q["expected_answer"],
                "source_clause_ids": q["source_clause_ids"],
                "source_document_ids": [sid, tid],
                "reasoning_required": "Must identify SUPERSEDES relationships and determine which clauses are still active"
            })
        except:
            questions.append({
                "question_id": f"H{i+1:03d}",
                "question": f"Sau khi {src_doc['doc_number']} có hiệu lực, điều khoản {tgt_clause['key']} của {tgt_doc['doc_number']} còn hiệu lực không?",
                "question_type": "supersession",
                "difficulty": "hard",
                "expected_answer": f"Không, {tgt_doc['doc_number']} {tgt_clause['key']} đã bị thay thế bởi {src_doc['doc_number']} {src_clause['key']}. {src_clause['text'][:200]}",
                "source_clause_ids": [src_clause["clause_id"], tgt_clause["clause_id"]],
                "source_document_ids": [sid, tid],
                "reasoning_required": "Must identify SUPERSEDES relationships and determine which clauses are still active"
            })
    
    # Part 2: Conflict detection (15)
    print(f"\n--- Conflict (15) ---")
    # Find docs in same field with potentially conflicting provisions
    field_groups = defaultdict(list)
    for did, doc in doc_metadata.items():
        field = doc.get("field", "Khác")
        field_groups[field].append(did)
    
    conflict_pairs = []
    # Find two docs from same/similar field that reference each other
    candidates_list = list(doc_metadata.values())
    random.shuffle(candidates_list)
    seen_pairs = set()
    
    for d1 in candidates_list:
        if d1["clause_count"] < 2:
            continue
        for d2 in candidates_list:
            if d1["doc_id"] == d2["doc_id"]:
                continue
            if d2["clause_count"] < 2:
                continue
            key = tuple(sorted([d1["doc_id"], d2["doc_id"]]))
            if key in seen_pairs:
                continue
            # Same field or cross-reference
            if d1["field"] == d2["field"] and d1["field"] != "":
                seen_pairs.add(key)
                conflict_pairs.append((d1, d2))
                if len(conflict_pairs) >= 20:
                    break
        if len(conflict_pairs) >= 20:
            break
    
    base_idx = 15
    for i, (d1, d2) in enumerate(conflict_pairs[:15]):
        c1 = random.choice(d1["clauses"])
        c2 = random.choice(d2["clauses"])
        
        prompt = f"""
Bạn là chuyên gia pháp lý Việt Nam. Hai văn bản sau cùng lĩnh vực.

Văn bản 1:
{d1['doc_number']} - {d1['title'][:100]} ({d1['agency']})
Điều khoản: {c1['key']}: {c1['text'][:300]}

Văn bản 2:
{d2['doc_number']} - {d2['title'][:100]} ({d2['agency']})
Điều khoản: {c2['key']}: {c2['text'][:300]}

Hãy tạo MỘT câu hỏi phát hiện MÂU THUẪN tiềm ẩn hoặc khác biệt giữa hai quy định này.
Nếu không có mâu thuẫn, hãy tạo câu hỏi so sánh sự khác biệt.

Trả lời JSON:
{{
  "question": "...",
  "expected_answer": "...",
  "source_clause_ids": ["{c1['clause_id']}", "{c2['clause_id']}"],
  "reasoning": "Detect CONFLICTS_WITH or differences between two related provisions"
}}
"""
        
        result = call_llm(prompt, temperature=0.8)
        print(f"  [{i+1}/15] {d1['doc_number'][:20]} vs {d2['doc_number'][:20]}")
        
        try:
            q = json.loads(result.strip().strip("```json").strip("```").strip())
            questions.append({
                "question_id": f"H{base_idx+i+1:03d}",
                "question": q["question"],
                "question_type": "conflict",
                "difficulty": "hard",
                "expected_answer": q["expected_answer"],
                "source_clause_ids": q["source_clause_ids"],
                "source_document_ids": [d1["doc_id"], d2["doc_id"]],
                "reasoning_required": "Detect CONFLICTS_WITH or differences between two related provisions"
            })
        except:
            questions.append({
                "question_id": f"H{base_idx+i+1:03d}",
                "question": f"So sánh quy định tại {c1['key']} của {d1['doc_number']} và {c2['key']} của {d2['doc_number']}. Có mâu thuẫn không?",
                "question_type": "conflict",
                "difficulty": "hard",
                "expected_answer": f"Cần xem xét: {d1['doc_number']} {c1['key']}: {c1['text'][:200]} | {d2['doc_number']} {c2['key']}: {c2['text'][:200]}",
                "source_clause_ids": [c1["clause_id"], c2["clause_id"]],
                "source_document_ids": [d1["doc_id"], d2["doc_id"]],
                "reasoning_required": "Detect CONFLICTS_WITH or differences between two related provisions"
            })
    
    # Part 3: Multi-hop (10)
    print(f"\n--- Multi-hop (10) ---")
    base_idx = 30
    for i in range(10):
        # Pick a starting document and find a chain
        chain_docs = random.sample(list(doc_metadata.keys()), min(3, len(doc_metadata)))
        chain = []
        for did in chain_docs:
            if did in doc_metadata:
                d = doc_metadata[did]
                if d["clauses"]:
                    chain.append(d)
        if len(chain) < 2:
            continue
        
        chain_desc = "\n---\n".join(
            f"VB {j+1}: {d['doc_number']} - {d['title'][:80]}\nĐiều khoản: {random.choice(d['clauses'])['key']}: {random.choice(d['clauses'])['text'][:250]}"
            for j, d in enumerate(chain[:3])
        )
        
        prompt = f"""
Bạn là chuyên gia pháp lý Việt Nam. Các văn bản sau có liên quan đến nhau:

{chain_desc}

Hãy tạo MỘT câu hỏi phức tạp, yêu cầu người dùng kết hợp thông tin từ NHIỀU văn bản (multi-hop reasoning).

Trả lời JSON:
{{
  "question": "...",
  "expected_answer": "...",
  "source_clause_ids": [...],
  "reasoning": "Must traverse across multiple documents for multi-hop reasoning"
}}
"""
        
        result = call_llm(prompt, temperature=0.9)
        clauses_used = []
        doc_ids_used = []
        for d in chain[:3]:
            if d["clauses"]:
                c = random.choice(d["clauses"])
                clauses_used.append(c["clause_id"])
                doc_ids_used.append(d["doc_id"])
        
        print(f"  [{i+1}/10] Chain of {len(chain)} docs")
        
        try:
            q = json.loads(result.strip().strip("```json").strip("```").strip())
            questions.append({
                "question_id": f"H{base_idx+i+1:03d}",
                "question": q["question"],
                "question_type": "multi_hop",
                "difficulty": "hard",
                "expected_answer": q["expected_answer"],
                "source_clause_ids": q.get("source_clause_ids", clauses_used),
                "source_document_ids": q.get("source_document_ids", doc_ids_used),
                "reasoning_required": "Must traverse across multiple documents for multi-hop reasoning"
            })
        except:
            questions.append({
                "question_id": f"H{base_idx+i+1:03d}",
                "question": f"Kết hợp các quy định từ {', '.join(d['doc_number'] for d in chain[:3])} để trả lời: quy trình xử lý như thế nào?",
                "question_type": "multi_hop",
                "difficulty": "hard",
                "expected_answer": f"Cần tham chiếu: {', '.join(clauses_used)}",
                "source_clause_ids": clauses_used,
                "source_document_ids": doc_ids_used,
                "reasoning_required": "Must traverse across multiple documents for multi-hop reasoning"
            })
    
    return questions


def save_benchmark(questions, benchmark_dir):
    """Save benchmark dataset in standard format."""
    benchmark_dir = Path(benchmark_dir)
    benchmark_dir.mkdir(parents=True, exist_ok=True)
    
    # Prepare questions file
    q_list = []
    a_list = []
    for q in questions:
        q_list.append({
            "question_id": q["question_id"],
            "question": q["question"],
            "question_type": q["question_type"],
            "difficulty": q["difficulty"]
        })
        a_list.append({
            "question_id": q["question_id"],
            "expected_answer": q["expected_answer"],
            "source_clause_ids": q["source_clause_ids"],
            "source_document_ids": q["source_document_ids"],
            "reasoning_required": q["reasoning_required"]
        })
    
    # Write questions
    q_path = benchmark_dir / "questions.json"
    q_path.write_text(json.dumps(q_list, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"\nSaved {len(q_list)} questions to {q_path}")
    
    # Write answers
    a_path = benchmark_dir / "answers.json"
    a_path.write_text(json.dumps(a_list, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"Saved {len(a_list)} answers to {a_path}")
    
    # Summary
    types = defaultdict(int)
    difficulties = defaultdict(int)
    for q in questions:
        types[q["question_type"]] += 1
        difficulties[q["difficulty"]] += 1
    
    print(f"\n{'='*60}")
    print("Benchmark Summary:")
    print(f"{'='*60}")
    print(f"Total questions: {len(questions)}")
    print(f"\nBy difficulty:")
    for d, c in sorted(difficulties.items()):
        print(f"  {d}: {c}")
    print(f"\nBy type:")
    for t, c in sorted(types.items()):
        print(f"  {t}: {c}")
    
    return q_path, a_path


def main():
    random.seed(42)
    
    print("=" * 60)
    print("VBPLVN Benchmark Dataset Generator")
    print("=" * 60)
    print(f"OpenRouter key: {OPENROUTER_API_KEY[:15]}...")
    print(f"Model: {LLM_MODEL}")
    
    # Step 1: Load dataset
    print("\nStep 1: Loading VBPLVN dataset...")
    doc_metadata, graph = build_dataset()
    print(f"  Loaded {len(doc_metadata)} documents with metadata")
    print(f"  Graph has {sum(len(v) for v in graph.values())} internal edges")
    
    # Step 2: Filter to key docs (with amend/supersede relations)
    print("\nStep 2: Filtering key documents...")
    key_docs, amend_docs, supersede_docs = get_key_docs(doc_metadata, graph)
    print(f"  Key docs (with amend/supersede): {len(key_docs)}")
    
    # Step 3: Generate easy questions (18)
    easy_qs = generate_easy_questions(key_docs, n=18)
    print(f"  Generated {len(easy_qs)} easy questions")
    
    # Step 4: Generate medium questions (42)
    medium_qs = generate_medium_questions(key_docs, graph, n=42)
    print(f"  Generated {len(medium_qs)} medium questions")
    
    # Step 5: Generate hard questions (40)
    hard_qs = generate_hard_questions(key_docs, graph, n=40)
    print(f"  Generated {len(hard_qs)} hard questions")
    
    # Combine
    all_questions = easy_qs + medium_qs + hard_qs
    
    # Step 6: Save
    save_benchmark(all_questions, BENCHMARK_DIR)
    
    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)


if __name__ == "__main__":
    main()
