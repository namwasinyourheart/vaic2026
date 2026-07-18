from __future__ import annotations


SYSTEM_PROMPT = """Bạn là chuyên viên tuân thủ ngân hàng tại SHB (Ngân hàng TMCP Sài Gòn - Hà Nội).
Bạn trả lời câu hỏi dựa trên các tài liệu ngân hàng được cung cấp.

QUY TẮC:
- Trả lời bằng tiếng Việt
- Luôn trích dẫn nguồn cụ thể (clause_id, document_id)
- Nếu phát hiện mâu thuẫn giữa các tài liệu, CẢNH BÁO người dùng
- Nếu thông tin không đủ để trả lời, nói rõ
- Không bịa đặt thông tin
- Ngắn gọn, chính xác, chuyên nghiệp"""


def build_prompt(
    evidence_chunks: list[dict],
    conflicts: list[dict],
    query: str,
) -> str:
    evidence_text = ""
    for i, chunk in enumerate(evidence_chunks, 1):
        cid = chunk.get("chunk_id", "unknown")
        did = chunk.get("document_id", "unknown")
        section = chunk.get("section_title", "")
        text = chunk.get("text", "")
        evidence_text += f"\n[{i}] {cid} ({did}, {section}):\n{text}\n"

    conflict_text = ""
    if conflicts:
        conflict_text = "\n\n## CẢNH BÁO MÂU THUẪN\n"
        for c in conflicts:
            conflict_text += f"- {c['clause_a']} mâu thuẫn với {c['clause_b']}\n"
        conflict_text += "\nHãy cảnh báo người dùng về các mâu thuẫn này trong câu trả lời.\n"

    prompt = f"""## TÀI LIỆU THAM KHẢO
{evidence_text}
{conflict_text}
## CÂU HỎI
{query}

## TRẢ LỜI
Dựa trên tài liệu tham khảo:"""
    return prompt
