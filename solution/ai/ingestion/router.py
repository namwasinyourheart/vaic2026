from .detector import detect_format
from .clause_parser import ClauseParser
from .section_parser import SectionParser
from .qa_parser import QAParser
from .paragraph_parser import ParagraphParser
from .base_parser import Chunk, extract_frontmatter

PARSERS = {
    "clause": ClauseParser(),
    "section": SectionParser(),
    "qa": QAParser(),
    "paragraph": ParagraphParser(),
}


def parse_document(filepath, clauses_meta: dict | None = None) -> list[Chunk]:
    from pathlib import Path

    if isinstance(filepath, (str, Path)):
        filepath = Path(filepath)
        md_text = filepath.read_text(encoding="utf-8")
    else:
        md_text = filepath

    metadata, body = extract_frontmatter(md_text)
    fmt = detect_format(body, metadata.get("type", ""))
    parser = PARSERS[fmt]

    if fmt == "clause" and clauses_meta is not None:
        return parser.parse(body, metadata, clauses_meta)
    return parser.parse(body, metadata)
