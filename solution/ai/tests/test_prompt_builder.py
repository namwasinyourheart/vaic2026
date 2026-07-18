from rag.prompt_builder import build_prompt, SYSTEM_PROMPT


class TestBuildPrompt:
    def test_basic_prompt(self, sample_evidence_chunks, sample_conflicts):
        prompt = build_prompt(sample_evidence_chunks, sample_conflicts, "Lãi suất是多少?")
        assert "TÀI LIỆU THAM KHẢO" in prompt
        assert "CRD-C01-3.1" in prompt
        assert "LGP-P01-2.2" in prompt
        assert "CÂU HỎI" in prompt
        assert "Lãi suất是多少?" in prompt

    def test_prompt_with_conflicts(self, sample_evidence_chunks, sample_conflicts):
        prompt = build_prompt(sample_evidence_chunks, sample_conflicts, "test")
        assert "CẢNH BÁO MÂU THUẪN" in prompt
        assert "CRD-R01-v2-3.2" in prompt
        assert "AML-P01-3.2" in prompt

    def test_prompt_without_conflicts(self, sample_evidence_chunks):
        prompt = build_prompt(sample_evidence_chunks, [], "test")
        assert "CẢNH BÁO MÂU THUẪN" not in prompt

    def test_prompt_empty_evidence(self):
        prompt = build_prompt([], [], "test query")
        assert "TÀI LIỆU THAM KHẢO" in prompt
        assert "test query" in prompt

    def test_system_prompt_content(self):
        assert "SHB" in SYSTEM_PROMPT
        assert "tiếng Việt" in SYSTEM_PROMPT
        assert "trích dẫn" in SYSTEM_PROMPT
