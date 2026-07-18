import re
from .base_parser import AbstractParser, Chunk, extract_frontmatter, estimate_tokens

QA_SPLIT = re.compile(
    r"(?=^(?:\*\*Q\d+|Q\d+[:.]|###\s*Q|##\s*\d+\.))",
    re.MULTILINE,
)
QUESTION_RE = re.compile(r"^(?:\*\*Q?\d+\*\*|Q\d+[:.]|###\s*Q\d+|##\s*\d+\.)\s*(.+)$", re.MULTILINE)


class QAParser(AbstractParser):
    def parse(self, md_text: str, metadata: dict) -> list[Chunk]:
        meta = self._build_metadata(metadata)
        doc_id = meta["document_id"]
        chunks: list[Chunk] = []

        sections = QA_SPLIT.split(md_text)

        for i, section in enumerate(sections):
            section = section.strip()
            if not section:
                continue

            q_match = QUESTION_RE.search(section)
            if q_match:
                question = q_match.group(1).strip() if q_match.lastindex else section.split("\n")[0]
                answer_start = q_match.end()
                answer = section[answer_start:].strip()
                if not answer:
                    answer = section
            else:
                question = section.split("\n")[0].strip("*")
                answer = section

            if not answer:
                continue

            chunk = Chunk(
                chunk_id=f"{doc_id}-QA{i}",
                chunk_type="qa",
                document_id=doc_id,
                document_type=meta["document_type"],
                section_title="FAQ",
                text=f"Câu hỏi: {question}\nTrả lời: {answer}",
                token_count=estimate_tokens(answer),
                domain=meta["domain"],
                version=meta["version"],
                effective_date=meta["effective_date"],
                status=meta["status"],
                language=meta["language"],
                access_level=meta["access_level"],
                owner_department=meta["owner_department"],
            )
            chunks.append(chunk)

        return chunks
