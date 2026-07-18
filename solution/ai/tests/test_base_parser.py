from ingestion.base_parser import Chunk, extract_frontmatter, estimate_tokens


class TestChunk:
    def test_create_chunk(self):
        chunk = Chunk(
            chunk_id="CRD-C01-3.1",
            chunk_type="clause",
            document_id="CRD-C01",
            document_type="ContractTemplate",
            section_title="Điều khoản tài chính",
            text="Lãi suất là 9,0%/năm.",
            token_count=5,
            domain="CRD",
            version="1.0",
            effective_date="2024-01-01",
        )
        assert chunk.chunk_id == "CRD-C01-3.1"
        assert chunk.chunk_type == "clause"
        assert chunk.status == "Active"
        assert chunk.language == "vi"
        assert chunk.expiry_date is None

    def test_to_payload(self):
        chunk = Chunk(
            chunk_id="CRD-C01-3.1",
            chunk_type="clause",
            document_id="CRD-C01",
            document_type="ContractTemplate",
            section_title="Điều khoản",
            text="Lãi suất 9%.",
            token_count=3,
            domain="CRD",
            version="1.0",
            effective_date="2024-01-01",
            expiry_date="2029-01-01",
            references=["LGP-P01-2.2"],
            conflicts_with=["AML-P01-3.2"],
        )
        payload = chunk.to_payload()
        assert payload["chunk_id"] == "CRD-C01-3.1"
        assert payload["expiry_date"] == "2029-01-01"
        assert payload["references"] == ["LGP-P01-2.2"]
        assert payload["conflicts_with"] == ["AML-P01-3.2"]
        assert "embedding" not in payload

    def test_to_payload_default_lists(self):
        chunk = Chunk(
            chunk_id="X-1.1",
            chunk_type="clause",
            document_id="X",
            document_type="Policy",
            section_title="",
            text="text",
            token_count=1,
            domain="X",
            version="1.0",
            effective_date="2024-01-01",
        )
        payload = chunk.to_payload()
        assert payload["references"] == []
        assert payload["conflicts_with"] == []


class TestExtractFrontmatter:
    def test_with_frontmatter(self, sample_md_text):
        meta, body = extract_frontmatter(sample_md_text)
        assert meta["document_id"] == "CRD-C01"
        assert meta["type"] == "ContractTemplate"
        assert "CRD-C01-3.1" in body

    def test_without_frontmatter(self):
        text = "No frontmatter here."
        meta, body = extract_frontmatter(text)
        assert meta == {}
        assert body == text

    def test_empty_frontmatter(self):
        text = "---\n---\nBody text"
        meta, body = extract_frontmatter(text)
        assert meta == {}
        assert body == "Body text"

    def test_invalid_yaml_frontmatter(self):
        text = "---\n: invalid: yaml: [[\n---\nBody"
        meta, body = extract_frontmatter(text)
        assert meta == {}
        assert "Body" in body


class TestEstimateTokens:
    def test_simple_text(self):
        assert estimate_tokens("hello world") == 2

    def test_vietnamese_text(self):
        assert estimate_tokens("Lãi suất là 9,0%/năm") == 4

    def test_empty_text(self):
        assert estimate_tokens("") == 0
