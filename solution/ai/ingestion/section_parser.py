import re
from .base_parser import AbstractParser, Chunk, extract_frontmatter, estimate_tokens

HEADER_RE = re.compile(r"^(##)\s+(.+)$", re.MULTILINE)
MAX_SECTION_TOKENS = 512
SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")


class SectionParser(AbstractParser):
    def parse(self, md_text: str, metadata: dict) -> list[Chunk]:
        meta = self._build_metadata(metadata)
        doc_id = meta["document_id"]
        chunks: list[Chunk] = []

        header_matches = list(HEADER_RE.finditer(md_text))

        for i, hm in enumerate(header_matches):
            start = hm.end()
            end = header_matches[i + 1].start() if i + 1 < len(header_matches) else len(md_text)
            section_title = hm.group(2).strip()
            section_text = md_text[start:end].strip()

            if not section_text:
                continue

            tokens = estimate_tokens(section_text)
            if tokens <= MAX_SECTION_TOKENS:
                chunk = Chunk(
                    chunk_id=f"{doc_id}-S{i}",
                    chunk_type="section",
                    document_id=doc_id,
                    document_type=meta["document_type"],
                    section_title=section_title,
                    text=section_text,
                    token_count=tokens,
                    domain=meta["domain"],
                    version=meta["version"],
                    effective_date=meta["effective_date"],
                    status=meta["status"],
                    language=meta["language"],
                    access_level=meta["access_level"],
                    owner_department=meta["owner_department"],
                )
                chunks.append(chunk)
            else:
                paragraphs = re.split(r"\n\n+", section_text)
                sub_idx = 0
                for para in paragraphs:
                    para = para.strip()
                    if not para:
                        continue
                    chunk = Chunk(
                        chunk_id=f"{doc_id}-S{i}-P{sub_idx}",
                        chunk_type="section",
                        document_id=doc_id,
                        document_type=meta["document_type"],
                        section_title=section_title,
                        text=para,
                        token_count=estimate_tokens(para),
                        domain=meta["domain"],
                        version=meta["version"],
                        effective_date=meta["effective_date"],
                        status=meta["status"],
                        language=meta["language"],
                        access_level=meta["access_level"],
                        owner_department=meta["owner_department"],
                    )
                    chunks.append(chunk)
                    sub_idx += 1

        return chunks
