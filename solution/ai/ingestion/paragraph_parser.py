import re
from .base_parser import AbstractParser, Chunk, extract_frontmatter, estimate_tokens

PARAGRAPH_SPLIT = re.compile(r"\n\n+")
MAX_PARA_TOKENS = 512
OVERLAP_TOKENS = 50


class ParagraphParser(AbstractParser):
    def parse(self, md_text: str, metadata: dict) -> list[Chunk]:
        meta = self._build_metadata(metadata)
        doc_id = meta["document_id"]
        chunks: list[Chunk] = []

        paragraphs = PARAGRAPH_SPLIT.split(md_text)
        buf = ""
        idx = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            candidate = f"{buf}\n\n{para}" if buf else para
            if estimate_tokens(candidate) <= MAX_PARA_TOKENS:
                buf = candidate
            else:
                if buf:
                    chunk = Chunk(
                        chunk_id=f"{doc_id}-P{idx}",
                        chunk_type="paragraph",
                        document_id=doc_id,
                        document_type=meta["document_type"],
                        section_title="",
                        text=buf.strip(),
                        token_count=estimate_tokens(buf),
                        domain=meta["domain"],
                        version=meta["version"],
                        effective_date=meta["effective_date"],
                        status=meta["status"],
                        language=meta["language"],
                        access_level=meta["access_level"],
                        owner_department=meta["owner_department"],
                    )
                    chunks.append(chunk)
                    idx += 1
                buf = para

        if buf:
            chunk = Chunk(
                chunk_id=f"{doc_id}-P{idx}",
                chunk_type="paragraph",
                document_id=doc_id,
                document_type=meta["document_type"],
                section_title="",
                text=buf.strip(),
                token_count=estimate_tokens(buf),
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
