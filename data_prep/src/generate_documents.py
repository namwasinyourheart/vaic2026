"""
Step 2: Generate document content using LLM.
Reads structure from Step 1, calls LLM for each document, saves .md files.
"""
import json
import sys
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from knowledge_universe import DOMAINS, DOCUMENTS, RELATIONSHIPS
from utils import call_llm, save_json, ensure_dirs
from config import OUTPUT_DIR, DOCS_DIR, METADATA_DIR

SYSTEM_PROMPT = """You are a senior banking compliance expert at a Vietnamese commercial bank (SHB - Saigon-Hanoi Commercial Joint Stock Bank). You generate realistic banking documents in Markdown format.

Rules:
- Write in the language specified (Vietnamese or English)
- Use realistic banking terminology and legal language
- Each section MUST start with its clause ID in bold, e.g., **Điều 1.1.** or **Clause 1.1.**
- Every clause MUST contain 1-3 substantive sentences with real banking content
- Reference other clause IDs naturally in the text when the document's relationships require it
- For amended documents: only rewrite the clauses listed as amended, include a section at the end noting which clauses are superseded
- For contract templates: use realistic placeholder format like [Tên khách hàng], [Số CMND/CCCD]
- Include realistic numbers, interest rates, time limits that are consistent with Vietnamese banking
- Do NOT include YAML frontmatter — only Markdown content
- Start with the document title as H1, then H2 for sections"""


def get_domain_info(domain_id: str) -> dict:
    return next(d for d in DOMAINS if d["domain_id"] == domain_id)


def get_related_clauses(doc_id: str) -> dict:
    refs_out = []
    refs_in = []
    amends_out = []
    supersedes_out = []
    conflicts_out = []

    for src, tgt in RELATIONSHIPS["references"]:
        if src.startswith(doc_id):
            refs_out.append(tgt)
        if tgt.startswith(doc_id):
            refs_in.append(src)
    for src, tgt in RELATIONSHIPS["amends"]:
        if src.startswith(doc_id):
            amends_out.append(tgt)
    for src, tgt in RELATIONSHIPS["supersedes"]:
        if src.startswith(doc_id):
            supersedes_out.append(tgt)
    for src, tgt in RELATIONSHIPS["conflicts_with"]:
        if src.startswith(doc_id):
            conflicts_out.append(tgt)
        if tgt.startswith(doc_id):
            conflicts_out.append(src)

    return {
        "references": refs_out,
        "referenced_by": refs_in,
        "amends": amends_out,
        "supersedes": supersedes_out,
        "conflicts_with": conflicts_out,
    }


def build_user_prompt(doc: dict, relations: dict) -> str:
    domain = get_domain_info(doc["domain"])

    sections_text = ""
    for sec in doc["sections"]:
        sections_text += f"\n### {sec['title']}\n"
        for clause_num in sec["clauses"]:
            section_idx = clause_num.split(".")[0]
            clause_idx = clause_num.split(".")[1]
            full_id = f"{doc['document_id']}-{section_idx}.{clause_idx}"
            sections_text += f"- **{full_id}**\n"

    rel_text = ""
    if relations["references"]:
        rel_text += f"\nThis document MUST reference these clauses (cite them naturally in text):\n"
        for r in relations["references"]:
            rel_text += f"  - {r}\n"
    if relations["amends"]:
        rel_text += f"\nThis document AMENDS these clauses from a previous version. Only rewrite these clauses with updated content:\n"
        for a in relations["amends"]:
            rel_text += f"  - {a} (supersedes the original)\n"
    if relations["supersedes"]:
        rel_text += f"\nThis document SUPERSEDES these clauses. Mention the supersession:\n"
        for s in relations["supersedes"]:
            rel_text += f"  - {s}\n"
    if relations["conflicts_with"]:
        rel_text += f"\nThis document has INTENTIONAL CONFLICTS with these clauses (write different values):conflicts_with\n"
        for c in relations["conflicts_with"]:
            rel_text += f"  - {c}\n"

    prompt = f"""Generate the document: {doc['title']} ({doc['title_en']})

Domain: {domain['name']} ({domain['name_en']})
Document ID: {doc['document_id']}
Type: {doc['type']}
Version: {doc['version']}
Effective date: {doc['effective_date']}
Expiry date: {doc.get('expiry_date', 'N/A')}
Language: {doc['language']}

Summary: {doc['summary']}

## Required Structure
{sections_text}
{rel_text}

## Important Notes
- Write each clause with realistic, substantive banking content (not just placeholders)
- Use Vietnamese banking regulations and practices as reference
- Include specific numbers (interest rates, limits, timeframes) that are realistic for Vietnamese banking
- The document should read like a real banking document, not a template
"""
    return prompt


def generate_markdown_frontmatter(doc: dict) -> str:
    return f"""---
document_id: {doc['document_id']}
title: "{doc['title']}"
title_en: "{doc['title_en']}"
domain: {doc['domain']}
type: {doc['type']}
version: "{doc['version']}"
effective_date: {doc['effective_date']}
expiry_date: {doc.get('expiry_date', 'N/A')}
status: {doc['status']}
language: {doc['language']}
access_level: {doc['access_level']}
owner_department: {doc['owner_department']}
---

"""


def main():
    ensure_dirs()
    print("=== Step 2: Generate Documents (LLM) ===\n")

    generated = 0
    skipped = 0

    for i, doc in enumerate(DOCUMENTS, 1):
        doc_id = doc["document_id"]
        out_path = DOCS_DIR / f"{doc_id}.md"

        # Skip if already exists
        if out_path.exists():
            print(f"[{i}/{len(DOCUMENTS)}] SKIP (exists): {doc_id}")
            skipped += 1
            continue

        print(f"[{i}/{len(DOCUMENTS)}] Generating: {doc_id} — {doc['title']}...")

        relations = get_related_clauses(doc_id)
        user_prompt = build_user_prompt(doc, relations)

        content = call_llm(SYSTEM_PROMPT, user_prompt)

        # Strip any accidental YAML frontmatter from LLM output
        content = re.sub(r'^---\n.*?\n---\n', '', content, flags=re.DOTALL)

        # Prepend our own frontmatter
        full_md = generate_markdown_frontmatter(doc) + content

        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(full_md, encoding="utf-8")
        print(f"  -> {out_path}")
        generated += 1

    print(f"\n=== Done: {generated} generated, {skipped} skipped ===")


if __name__ == "__main__":
    main()
