from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path

import yaml


@dataclass
class Chunk:
    chunk_id: str
    chunk_type: str  # clause | section | qa | paragraph
    document_id: str
    document_type: str
    section_title: str
    text: str
    token_count: int
    domain: str
    version: str
    effective_date: str
    expiry_date: str | None = None
    status: str = "Active"
    language: str = "vi"
    access_level: str = "Internal"
    owner_department: str = ""
    references: list[str] = field(default_factory=list)
    amended_by: str | None = None
    superseded_by: str | None = None
    conflicts_with: list[str] = field(default_factory=list)
    embedding: list[float] | None = None

    def to_payload(self) -> dict:
        return {
            "chunk_id": self.chunk_id,
            "chunk_type": self.chunk_type,
            "document_id": self.document_id,
            "document_type": self.document_type,
            "section_title": self.section_title,
            "text": self.text,
            "token_count": self.token_count,
            "domain": self.domain,
            "version": self.version,
            "effective_date": self.effective_date,
            "expiry_date": self.expiry_date,
            "status": self.status,
            "language": self.language,
            "access_level": self.access_level,
            "owner_department": self.owner_department,
            "references": self.references,
            "conflicts_with": self.conflicts_with,
        }


def extract_frontmatter(md_text: str) -> tuple[dict, str]:
    if md_text.startswith("---"):
        parts = md_text.split("---", 2)
        if len(parts) >= 3:
            try:
                meta = yaml.safe_load(parts[1]) or {}
            except yaml.YAMLError:
                meta = {}
            body = parts[2].strip()
            return meta, body
    return {}, md_text


def estimate_tokens(text: str) -> int:
    return len(text.split())


class AbstractParser(ABC):
    @abstractmethod
    def parse(self, md_text: str, metadata: dict) -> list[Chunk]:
        ...

    def _build_metadata(self, metadata: dict) -> dict:
        return {
            "document_id": metadata.get("document_id", ""),
            "document_type": metadata.get("type", ""),
            "domain": metadata.get("domain", ""),
            "version": metadata.get("version", "1.0"),
            "effective_date": metadata.get("effective_date", ""),
            "expiry_date": metadata.get("expiry_date"),
            "status": metadata.get("status", "Active"),
            "language": metadata.get("language", "vi"),
            "access_level": metadata.get("access_level", "Internal"),
            "owner_department": metadata.get("owner_department", ""),
        }

    def _find_section_for_clause(self, md_text: str, pos: int) -> str:
        header_pattern = __import__("re").compile(r"^##\s+(.+)$", __import__("re").MULTILINE)
        last_title = ""
        for m in header_pattern.finditer(md_text):
            if m.start() <= pos:
                last_title = m.group(1).strip()
            else:
                break
        return last_title
