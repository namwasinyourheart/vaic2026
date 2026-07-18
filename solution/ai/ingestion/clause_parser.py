import re
from .base_parser import AbstractParser, Chunk, extract_frontmatter, estimate_tokens

_PREFIX = r"[A-Z]{2,4}-[A-Z]\d{2}(?:-v\d+)?"
_CLAUSE_NUM = r"\d+\.\d+"

CLAUSE_RE = re.compile(
    r"\*\*(" + _PREFIX + r"-" + _CLAUSE_NUM + r")\.?\*\*"
    r"[ \t]*(.*?)(?=\*\*" + _PREFIX + r"-" + _CLAUSE_NUM + r"|^##\s|\Z)",
    re.DOTALL | re.MULTILINE,
)

REF_RE = re.compile(r"\((" + _PREFIX + r"-" + _CLAUSE_NUM + r")\)")
HEADER_RE = re.compile(r"^##\s+(.+)$", re.MULTILINE)


class ClauseParser(AbstractParser):
    def parse(self, md_text: str, metadata: dict, clauses_meta: dict | None = None) -> list[Chunk]:
        meta = self._build_metadata(metadata)
        chunks: list[Chunk] = []

        for m in CLAUSE_RE.finditer(md_text):
            clause_id = m.group(1)
            text = m.group(2).strip()
            if not text:
                continue

            refs = REF_RE.findall(text)

            section_title = self._find_section_for_clause(md_text, m.start())
            doc_id = meta["document_id"]

            chunk = Chunk(
                chunk_id=clause_id,
                chunk_type="clause",
                document_id=doc_id,
                document_type=meta["document_type"],
                section_title=section_title,
                text=text,
                token_count=estimate_tokens(text),
                domain=meta["domain"],
                version=meta["version"],
                effective_date=meta["effective_date"],
                expiry_date=meta.get("expiry_date"),
                status=meta["status"],
                language=meta["language"],
                access_level=meta["access_level"],
                owner_department=meta["owner_department"],
                references=refs,
            )

            if clauses_meta and clause_id in clauses_meta:
                cm = clauses_meta[clause_id]
                chunk.amended_by = cm.get("amended_by", [None])[0] if cm.get("amended_by") else None
                chunk.superseded_by = cm.get("superseded_by", [None])[0] if cm.get("superseded_by") else None
                chunk.conflicts_with = cm.get("conflicts_with", [])

                # Override dates from clause metadata (Option 3)
                if cm.get("effective_date") is not None:
                    chunk.effective_date = cm["effective_date"]
                if cm.get("expiry_date") is not None:
                    chunk.expiry_date = cm["expiry_date"]

            chunks.append(chunk)

        return chunks
