from ingestion.clause_parser import ClauseParser


class TestClauseParser:
    def test_parse_basic(self, sample_md_text, sample_metadata):
        parser = ClauseParser()
        chunks = parser.parse(sample_md_text, sample_metadata)
        assert len(chunks) == 2
        assert chunks[0].chunk_id == "CRD-C01-3.1"
        assert chunks[1].chunk_id == "CRD-C01-3.2"

    def test_parse_clause_properties(self, sample_md_text, sample_metadata):
        parser = ClauseParser()
        chunks = parser.parse(sample_md_text, sample_metadata)
        chunk = chunks[0]
        assert chunk.chunk_type == "clause"
        assert chunk.document_id == "CRD-C01"
        assert chunk.document_type == "ContractTemplate"
        assert chunk.domain == "CRD"
        assert chunk.effective_date == "2024-01-01"
        assert chunk.expiry_date == "2029-01-01"
        assert "9,0%/năm" in chunk.text

    def test_parse_empty_text(self, sample_metadata):
        parser = ClauseParser()
        chunks = parser.parse("## Section\n\nNo clauses here.", sample_metadata)
        assert len(chunks) == 0

    def test_parse_with_clauses_meta_override(self, sample_md_text, sample_metadata, sample_clauses_meta):
        parser = ClauseParser()
        chunks = parser.parse(sample_md_text, sample_metadata, clauses_meta=sample_clauses_meta)
        chunk_32 = [c for c in chunks if c.chunk_id == "CRD-C01-3.2"][0]
        assert chunk_32.effective_date == "2024-06-01"
        assert chunk_32.conflicts_with == ["AML-P01-3.2"]

    def test_parse_inherits_dates_when_no_override(self, sample_md_text, sample_metadata, sample_clauses_meta):
        parser = ClauseParser()
        chunks = parser.parse(sample_md_text, sample_metadata, clauses_meta=sample_clauses_meta)
        chunk_31 = [c for c in chunks if c.chunk_id == "CRD-C01-3.1"][0]
        assert chunk_31.effective_date == "2024-01-01"
        assert chunk_31.expiry_date == "2029-01-01"

    def test_parse_section_title(self, sample_md_text, sample_metadata):
        parser = ClauseParser()
        chunks = parser.parse(sample_md_text, sample_metadata)
        for chunk in chunks:
            assert "Điều khoản tài chính" in chunk.section_title

    def test_parse_no_references(self, sample_md_text, sample_metadata):
        parser = ClauseParser()
        chunks = parser.parse(sample_md_text, sample_metadata)
        for chunk in chunks:
            assert chunk.references == []
