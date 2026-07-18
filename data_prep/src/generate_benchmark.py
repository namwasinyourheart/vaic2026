"""
Step 3: Generate benchmark questions + ground truth answers.
Template-based: generates directly from knowledge_universe structure (no LLM needed).
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from knowledge_universe import DOMAINS, DOCUMENTS, RELATIONSHIPS, build_clause_list
from utils import save_json, ensure_dirs
from config import OUTPUT_DIR, BENCHMARK_DIR, GROUND_TRUTH_DIR

VALID_CLAUSE_IDS = {c["clause_id"] for c in build_clause_list()}
VALID_DOC_IDS = {d["document_id"] for d in DOCUMENTS}


def _get_doc_title(doc_id: str) -> str:
    for d in DOCUMENTS:
        if d["document_id"] == doc_id:
            return d["title"]
    return doc_id


def _get_clause_section(clause_id: str) -> str:
    for c in build_clause_list():
        if c["clause_id"] == clause_id:
            return c["section"]
    return ""


def _resolve_current_version(clause_id: str) -> str:
    """For amended/superseded clauses, return the current (latest) version."""
    for newer, older in RELATIONSHIPS["version_chain"]:
        if older in clause_id or clause_id.startswith(older.split("-")[0]):
            # This clause belongs to the old version
            return None  # caller should use newer version
    for src, tgt in RELATIONSHIPS["supersedes"]:
        if tgt == clause_id:
            return src
    for src, tgt in RELATIONSHIPS["amends"]:
        if tgt == clause_id:
            return src
    return clause_id


def _find_references_of(clause_id: str) -> list[str]:
    return [tgt for src, tgt in RELATIONSHIPS["references"] if src == clause_id]


def _find_referenced_by(clause_id: str) -> list[str]:
    return [src for src, tgt in RELATIONSHIPS["references"] if tgt == clause_id]


# ── Simple Retrieval ─────────────────────────────────────────────────────

def generate_simple_retrieval() -> list[dict]:
    questions = []
    # Pick clauses that have meaningful content (not amended/superseded)
    targets = [
        ("CRD-R01-2.1", "Điều kiện khách hàng vay tín chấp", "Điều kiện age/income requirements"),
        ("CRD-R01-3.1", "Hạn mức cho vay tín chấp", "Lending limit amounts"),
        ("AML-R01-2.1", "Thu thập thông tin KYC", "KYC information collection"),
        ("AML-R01-3.1", "Xác minh danh tính khách hàng", "Customer identity verification"),
        ("OPS-S01-1.1", "Tiếp nhận giao dịch tại quầy", "Teller transaction reception"),
        ("OPS-P01-4.1", "Xử lý chênh lệch tiền mặt", "Cash discrepancy handling"),
        ("DEP-R01-2.1", "Lãi suất tiền gửi tiết kiệm", "Savings interest rates"),
        ("DEP-R01-3.1", "Rút trước hạn tiết kiệm", "Early withdrawal penalty"),
        ("CMP-R01-2.1", "Chu kỳ báo cáo tuân thủ", "Compliance reporting cycle"),
        ("RSK-P01-1.1", "Phân loại rủi ro tín dụng", "Credit risk classification"),
        ("RSK-R01-1.1", "Yêu cầu vốn tối thiểu CAR", "Minimum capital adequacy"),
        ("DIG-P01-3.1", "Hạn mức giao dịch số", "Digital transaction limits"),
        ("LGP-R01-1.1", "Phân loại tranh chấp", "Dispute classification"),
        ("LGP-P01-2.1", "Soạn thảo và phê duyệt hợp đồng", "Contract drafting and approval"),
    ]

    templates = [
        ("{title} quy định những gì về {topic}?", "Theo {clause_id} ({section}), {topic_detail}."),
        ("Cho tôi biết về {topic} theo quy định hiện hành", "{clause_id} ({section}): {topic_detail}."),
        ("{topic} được quy định như thế nào?", "Dựa trên {clause_id}: {topic_detail}."),
    ]

    for i, (clause_id, topic_vn, topic_en) in enumerate(targets, 1):
        section = _get_clause_section(clause_id)
        doc_id = clause_id.split("-")[0] + "-" + clause_id.split("-")[1]
        if len(clause_id.split("-")) > 2:
            parts = clause_id.split("-")
            doc_id = "-".join(parts[:2])

        # Find the actual document_id
        actual_doc_id = None
        for d in DOCUMENTS:
            if clause_id.startswith(d["document_id"]):
                actual_doc_id = d["document_id"]
                break

        t = templates[i % len(templates)]
        question_text = t[0].format(
            title=_get_doc_title(actual_doc_id) if actual_doc_id else doc_id,
            topic=topic_vn,
        )
        answer_text = t[1].format(
            clause_id=clause_id,
            section=section,
            topic_detail=f"{topic_vn} ({topic_en})",
        )

        questions.append({
            "question_id": f"Q{i:03d}",
            "question": question_text,
            "question_type": "simple_retrieval",
            "difficulty": "easy",
            "expected_answer": answer_text,
            "source_clause_ids": [clause_id],
            "source_document_ids": [actual_doc_id] if actual_doc_id else [],
            "reasoning_required": "Direct single-clause lookup from hybrid search",
        })
    return questions


# ── Cross-Reference ──────────────────────────────────────────────────────

def generate_cross_reference() -> list[dict]:
    questions = []
    cross_ref_pairs = [
        ("CRD-R01-2.1", "AML-R01-2.1",
         "Khi cho vay tín chấp, yêu cầu KYC nào cần được tuân thủ?",
         "Điều kiện cho vay tín chấp (CRD-R01-2.1) yêu cầu tuân thủ quy định KYC (AML-R01-2.1) về nhận biết khách hàng."),
        ("CRD-P01-1.2", "AML-R01-1.1",
         "Chính sách thẩm định tín dụng liên quan gì đến quy định AML?",
         "Chính sách thẩm định tín dụng (CRD-P01-1.2) tham chiếu đến phạm vi AML (AML-R01-1.1) trong quá trình đánh giá khách hàng."),
        ("CRD-S01-2.2", "AML-S01-2.1",
         "Quy trình phê duyệt khoản vay cần thực hiện bước xác minh khách hàng nào?",
         "Trong quy trình phê duyệt khoản vay (CRD-S01-2.2), bước xác minh khách hàng phải tuân theo AML-S01-2.1."),
        ("OPS-S01-2.1", "AML-S01-2.1",
         "Giao dịch tại quầy cần đáp ứng yêu cầu xác minh nào từ quy định AML?",
         "Xác minh khách hàng tại quầy (OPS-S01-2.1) phải tuân theo quy trình AML-S01-2.1."),
        ("DEP-S01-2.1", "AML-R01-2.1",
         "Khi mở tài khoản tiết kiệm, yêu cầu KYC nào cần được thực hiện?",
         "Mở tài khoản tiết kiệm (DEP-S01-2.1) yêu cầu KYC theo AML-R01-2.1."),
        ("DIG-S01-1.1", "AML-R01-3.1",
         "Giao dịch trực tuyến cần đáp ứng yêu cầu xác thực danh tính nào?",
         "Xác thực người dùng trực tuyến (DIG-S01-1.1) phải tuân theo AML-R01-3.1 về xác minh danh tính."),
        ("CMP-R01-3.1", "RSK-P01-3.1",
         "Báo cáo tuân thủ cần đề cập những gì về theo dõi nợ xấu?",
         "Nội dung báo cáo tuân thủ (CMP-R01-3.1) bao gồm theo dõi nợ xấu theo RSK-P01-3.1."),
        ("RSK-P01-4.1", "LGP-R01-1.1",
         "Xử lý nợ xấu cần tuân theo quy định tranh chấp nào?",
         "Xử lý nợ xấu (RSK-P01-4.1) phải tham chiếu quy định tranh chấp LGP-R01-1-1."),
    ]

    for i, (src, tgt, question, answer) in enumerate(cross_ref_pairs, 1):
        src_doc = next((d["document_id"] for d in DOCUMENTS if src.startswith(d["document_id"])), None)
        tgt_doc = next((d["document_id"] for d in DOCUMENTS if tgt.startswith(d["document_id"])), None)
        questions.append({
            "question_id": f"Q{8 + i:03d}",
            "question": question,
            "question_type": "cross_reference",
            "difficulty": "medium",
            "expected_answer": answer,
            "source_clause_ids": [src, tgt],
            "source_document_ids": [d for d in [src_doc, tgt_doc] if d],
            "reasoning_required": "Follow REFERENCES link from source clause to target clause across documents",
        })
    return questions


# ── Amendment ─────────────────────────────────────────────────────────────

def generate_amendment() -> list[dict]:
    questions = []
    amendments = [
        ("CRD-R01-v2-3.1", "CRD-R01-3.1",
         "Hạn mức cho vay tín chấp theo quy định mới nhất là bao nhiêu?",
         "Theo bản sửa đổi CRD-R01-v2, hạn mức cho vay tín chấp (điều 3.1) đã được cập nhật. Phiên bản cũ CRD-R01-3.1 không còn hiệu lực.",
         "CRD-R01-v2"),
        ("CRD-R01-v2-3.2", "CRD-R01-3.2",
         "Lãi suất cho vay tín chấp hiện hành là bao nhiêu?",
         "Lãi suất cho vay tín chấp theo CRD-R01-v2 (điều 3.2) là phiên bản hiện hành, thay thế CRD-R01-3.2 cũ.",
         "CRD-R01-v2"),
        ("DEP-R01-v2-2.1", "DEP-R01-2.1",
         "Lãi suất tiền gửi tiết kiệm mới nhất là bao nhiêu?",
         "Lãi suất tiền gửi tiết kiệm theo DEP-R01-v2 (điều 2.1) đã được cập nhật, thay thế DEP-R01-2.1.",
         "DEP-R01-v2"),
        ("DEP-R01-v2-2.2", "DEP-R01-2.2",
         "Bảng lãi suất kỳ hạn tiền gửi hiện tại như thế nào?",
         "Bảng lãi suất kỳ hạn theo DEP-R01-v2 (điều 2.2) là phiên bản hiện hành, DEP-R01-2.2 cũ đã hết hiệu lực.",
         "DEP-R01-v2"),
        ("DEP-R01-v2-5.1", None,
         "Có sản phẩm tiết kiệm online không?",
         "DEP-R01-v2 bổ sung điều 5.1 về tiết kiệm online - đây là nội dung mới không có trong phiên bản cũ.",
         "DEP-R01-v2"),
    ]

    for i, (new_clause, old_clause, question, answer, current_doc) in enumerate(amendments, 1):
        src_doc = next((d["document_id"] for d in DOCUMENTS if new_clause.startswith(d["document_id"])), None)
        old_doc = next((d["document_id"] for d in DOCUMENTS if old_clause.startswith(d["document_id"])), None) if old_clause else None
        questions.append({
            "question_id": f"Q{16 + i:03d}",
            "question": question,
            "question_type": "amendment",
            "difficulty": "medium",
            "expected_answer": answer,
            "source_clause_ids": [new_clause] + ([old_clause] if old_clause else []),
            "source_document_ids": [d for d in [src_doc, old_doc] if d],
            "reasoning_required": "Must resolve latest version: check AMENDS chain, use v2 instead of v1",
        })
    return questions


# ── Supersession ──────────────────────────────────────────────────────────

def generate_supersession() -> list[dict]:
    questions = []
    supersessions = [
        ("Điều nào về lãi suất tiền gửi tiết kiệm đã bị thay thế?",
         "Điều 2.1 và 2.2 của DEP-R01 đã bị DEP-R01-v2 thay thế. Các điều khác của DEP-R01 vẫn còn hiệu lực.",
         ["DEP-R01-2.1", "DEP-R01-2.2"], ["DEP-R01-v2-2.1", "DEP-R01-v2-2.2"], ["DEP-R01", "DEP-R01-v2"]),
        ("Quy định cho vay tín chấp - điều nào về hạn mức đã không còn hiệu lực?",
         "Điều 3.1 và 3.2 về hạn mức và lãi suất của CRD-R01 đã bị CRD-R01-v2 thay thế.",
         ["CRD-R01-3.1", "CRD-R01-3.2"], ["CRD-R01-v2-3.1", "CRD-R01-v2-3.2"], ["CRD-R01", "CRD-R01-v2"]),
        ("Thông tư 35/2024 thay thế những điều nào của chính sách AML trước đó?",
         "AML-N01-2.1 và 2.2 thay thế AML-P01-3.1 và 3.2 về báo cáo giao dịch可疑.",
         ["AML-P01-3.1", "AML-P01-3.2"], ["AML-N01-2.1", "AML-N01-2.2"], ["AML-P01", "AML-N01"]),
        ("Thông tư 13/2024 thay thế những điều nào trong quy trình kiểm soát nội bộ?",
         "CMP-N01-2.1 và 2.2 thay thế CMP-S01-2.1 và 2.2 về hệ thống kiểm soát.",
         ["CMP-S01-2.1", "CMP-S01-2.2"], ["CMP-N01-2.1", "CMP-N01-2.2"], ["CMP-S01", "CMP-N01"]),
        ("Quy trình xử lý sự cố OPS-S02 thay thế phần nào của chính sách vận hành?",
         "OPS-S02-1.1 về phân loại sự cố thay thế OPS-P01-1.2.",
         ["OPS-P01-1.2"], ["OPS-S02-1.1"], ["OPS-P01", "OPS-S02"]),
    ]

    for i, (question, answer, old_clauses, new_clauses, doc_ids) in enumerate(supersessions, 1):
        all_clause_ids = old_clauses + new_clauses
        questions.append({
            "question_id": f"Q{21 + i:03d}",
            "question": question,
            "question_type": "supersession",
            "difficulty": "hard",
            "expected_answer": answer,
            "source_clause_ids": all_clause_ids,
            "source_document_ids": doc_ids,
            "reasoning_required": "Must identify SUPERSEDES relationships and determine which clauses are still active",
        })
    return questions


# ── Conflict Detection ────────────────────────────────────────────────────

def generate_conflicts() -> list[dict]:
    questions = []
    conflicts = [
        ("DEP-P01-2.1", "DIG-F01-2.1",
         "Lãi suất tiền gửi tiết kiệm online có khác với lãi suất thông thường không?",
         "CÓ MÂU THUẪN: DEP-P01-2.1 quy định lãi suất tiết kiệm là một mức, trong khi DIG-F01-2.1 đề cập lãi suất online cao hơn. Cần xác minh với phòng Compliance để biết quy định nào áp dụng.",
         ["DEP-P01", "DIG-F01"]),
        ("OPS-S01-3.3", "DIG-P01-3.2",
         "Hạn mức giao dịch tiền mặt tại quầy và giao dịch số có giống nhau không?",
         "CÓ MÂU THUẪN: OPS-S01-3.3 quy định hạn mức tiền mặt tại quầy khác với DIG-P01-3.2 về hạn mức giao dịch số. Hai quy định có thể chồng chéo.",
         ["OPS-S01", "DIG-P01"]),
        ("AML-R01-2.2", "CMP-N01-1.2",
         "Giấy tờ cần thiết để xác minh khách hàng là gì?",
         "CÓ MÂU THUẪN: AML-R01-2.2 yêu cầu hộ chiếu, trong khi CMP-N01-1.2 yêu cầu CCCD. Cần làm rõ giấy tờ nào được chấp nhận.",
         ["AML-R01", "CMP-N01"]),
        ("CMP-P01-2.1", "CMP-N01-2.1",
         "Kiểm toán nội bộ được thực hiện bao lâu一次?",
         "CÓ MÂU THUẪN: CMP-P01-2.1 quy định kiểm toán hàng quý, CMP-N01-2.1 quy định bán niên. Cần xác nhận tần suất hiện tại.",
         ["CMP-P01", "CMP-N01"]),
        ("CRD-S01-3.1", "RSK-P01-2.2",
         "Thẩm quyền phê duyệt khoản vay của trưởng phòng là bao nhiêu?",
         "CÓ MÂU THUẪN: CRD-S01-3.1 cho phép phê duyệt đến 500 triệu, RSK-P01-2.2 giới hạn chỉ 300 triệu. Cần xác nhận thẩm quyền đúng.",
         ["CRD-S01", "RSK-P01"]),
        ("OPS-S02-3.1", "CMP-R01-3.1",
         "Thời hạn báo cáo sự cố hệ thống là bao lâu?",
         "CÓ MÂU THUẪN: OPS-S02-3.1 yêu cầu báo cáo trong 1 giờ, CMP-R01-3.1 cho phép 4 giờ. Cần làm rõ thời hạn bắt buộc.",
         ["OPS-S02", "CMP-R01"]),
        ("LGP-R01-2.1", "CRD-R01-5.1",
         "Tranh chấp với khách hàng về khoản vay giải quyết như thế nào?",
         "CÓ MÂU THUẪN: LGP-R01-2.1 yêu cầu trọng tài bắt buộc trước, CRD-R01-5.1 cho phép khởi kiện trực tiếp ra tòa.",
         ["LGP-R01", "CRD-R01"]),
        ("DIG-P01-2.2", "AML-R01-3.1",
         "Xác thực giao dịch số cần những bước nào?",
         "CÓ MÂU THUẪN: DIG-P01-2.2 cho rằng OTP là đủ, AML-R01-3.1 yêu cầu sinh trắc học. Cần xác nhận yêu cầu bảo mật hiện tại.",
         ["DIG-P01", "AML-R01"]),
    ]

    for i, (clause_a, clause_b, question, answer, doc_ids) in enumerate(conflicts, 1):
        doc_a = next((d["document_id"] for d in DOCUMENTS if clause_a.startswith(d["document_id"])), None)
        doc_b = next((d["document_id"] for d in DOCUMENTS if clause_b.startswith(d["document_id"])), None)
        questions.append({
            "question_id": f"Q{26 + i:03d}",
            "question": question,
            "question_type": "conflict",
            "difficulty": "hard",
            "expected_answer": answer,
            "source_clause_ids": [clause_a, clause_b],
            "source_document_ids": [d for d in [doc_a, doc_b] if d] if not doc_ids else doc_ids,
            "reasoning_required": "Detect CONFLICTS_WITH relationship and explain the contradiction to the user",
        })
    return questions


# ── Multi-Hop ─────────────────────────────────────────────────────────────

def generate_multi_hop() -> list[dict]:
    questions = [
        {
            "question_id": "Q034",
            "question": "Khi một khách hàng muốn vay tín chấp, quy trình từ tiếp nhận hồ sơ đến giải ngân cần tuân theo những quy định nào từ nhiều văn bản?",
            "question_type": "multi_hop",
            "difficulty": "hard",
            "expected_answer": "Quy trình cho vay tín chấp yêu cầu: (1) Tiếp nhận hồ sơ theo CRD-S01-1.1, (2) Xác minh khách hàng theo AML-S01-2.1, (3) Thẩm định tín dụng theo CRD-P01-2.1, (4) Đánh giá rủi ro theo RSK-P01-2.1, (5) Phê duyệt theo CRD-S01-3.1, (6) Giải ngân theo CRD-S01-4.1.",
            "source_clause_ids": ["CRD-S01-1.1", "AML-S01-2.1", "CRD-P01-2.1", "RSK-P01-2.1", "CRD-S01-3.1", "CRD-S01-4.1"],
            "source_document_ids": ["CRD-S01", "AML-S01", "CRD-P01", "RSK-P01"],
            "reasoning_required": "Must traverse CRD-S01 → AML-S01 (via reference) → CRD-P01 → RSK-P01 (via reference), 4+ hops",
        },
        {
            "question_id": "Q035",
            "question": "Nếu khách hàng khiếu nại về lãi suất tiết kiệm, cần kiểm tra những quy định nào từ nhiều nguồn?",
            "question_type": "multi_hop",
            "difficulty": "hard",
            "expected_answer": "Cần kiểm tra: (1) DEP-R01-v2 về lãi suất hiện hành, (2) DEP-P01 về chính sách xác định lãi suất, (3) DIG-F01-2.1 về lãi suất online (có mâu thuẫn), (4) LGP-R01-1.1 về phân loại tranh chấp, (5) CMP-R01 về quy định báo cáo.",
            "source_clause_ids": ["DEP-R01-v2-2.1", "DEP-P01-2.1", "DIG-F01-2.1", "LGP-R01-1.1", "CMP-R01-1.1"],
            "source_document_ids": ["DEP-R01-v2", "DEP-P01", "DIG-F01", "LGP-R01", "CMP-R01"],
            "reasoning_required": "Must follow DEP-R01-v2 → DEP-P01 (reference) → detect conflict with DIG-F01 → LGP-R01 (dispute path), 4+ hops with conflict detection",
        },
        {
            "question_id": "Q036",
            "question": "Hệ thống ngân hàng bị sự cố, cần xử lý theo trình tự nào từ các quy trình vận hành, tuân thủ và pháp chế?",
            "question_type": "multi_hop",
            "difficulty": "hard",
            "expected_answer": "Trình tự: (1) OPS-S02-1.1 phân loại sự cố, (2) OPS-S02-2.1 phản ứng ban đầu, (3) OPS-S02-3.1 escalation (1 giờ), (4) CMP-R01-3.1 báo cáo tuân thủ (4 giờ - mâu thuẫn), (5) LGP-P01-4.2 xử lý trách nhiệm pháp lý, (6) OPS-S02-4.1 khôi phục.",
            "source_clause_ids": ["OPS-S02-1.1", "OPS-S02-2.1", "OPS-S02-3.1", "CMP-R01-3.1", "LGP-P01-4.2", "OPS-S02-4.1"],
            "source_document_ids": ["OPS-S02", "CMP-R01", "LGP-P01"],
            "reasoning_required": "Must follow OPS-S02 internal flow → detect conflict with CMP-R01 on timing → LGP-P01 for legal implications, 3+ domains",
        },
        {
            "question_id": "Q037",
            "question": "Một giao dịch chuyển khoản lớn bị nghi ngờ rửa tiền, quy trình xử lý từ đầu đến cuối cần tuân theo những quy định nào?",
            "question_type": "multi_hop",
            "difficulty": "hard",
            "expected_answer": "Quy trình: (1) OPS-S01-2.1 xác minh tại quầy, (2) AML-R01-2.2 kiểm tra KYC, (3) AML-P01-1.1 nhận diện giao dịch đáng ngờ, (4) AML-P01-2.1 đánh giá, (5) AML-P01-3.1 báo cáo đến NHNN, (6) RSK-P01-3.1 theo dõi rủi ro.",
            "source_clause_ids": ["OPS-S01-2.1", "AML-R01-2.2", "AML-P01-1.1", "AML-P01-2.1", "AML-P01-3.1", "RSK-P01-3.1"],
            "source_document_ids": ["OPS-S01", "AML-R01", "AML-P01", "RSK-P01"],
            "reasoning_required": "Must follow OPS-S01 → AML-R01 (reference) → AML-P01 workflow → RSK-P01 (monitoring), spanning 3 domains",
        },
        {
            "question_id": "Q038",
            "question": "Khi phát hiện mâu thuẫn giữa chính sách lãi suất tiết kiệm truyền thống và online, nhân viên cần xử lý theo quy trình nào?",
            "question_type": "multi_hop",
            "difficulty": "hard",
            "expected_answer": "Xử lý: (1) Phát hiện mâu thuẫn DEP-P01-2.1 vs DIG-F01-2.1, (2) Kiểm tra DEP-R01-v2 (quy định mới nhất), (3) Tham chiếu CMP-P01-3.1 về kiểm soát nội bộ, (4) Báo cáo theo CMP-R01-1.1, (5) Nếu cần, tham khảo LGP-R01 về tranh chấp.",
            "source_clause_ids": ["DEP-P01-2.1", "DIG-F01-2.1", "DEP-R01-v2-2.1", "CMP-P01-3.1", "CMP-R01-1.1", "LGP-R01-1.1"],
            "source_document_ids": ["DEP-P01", "DIG-F01", "DEP-R01-v2", "CMP-P01", "CMP-R01", "LGP-R01"],
            "reasoning_required": "Conflict detection → version resolution → compliance escalation → legal fallback, 4+ hops across 5 domains",
        },
    ]
    return questions


def main():
    ensure_dirs()
    print("=== Step 3: Generate Benchmark Q&A (Template) ===\n")

    out_questions = BENCHMARK_DIR / "questions.json"
    out_answers = GROUND_TRUTH_DIR / "answers.json"

    if out_questions.exists() and out_answers.exists():
        print("SKIP: Both files already exist.")
        return

    all_questions = []
    all_questions.extend(generate_simple_retrieval())
    all_questions.extend(generate_cross_reference())
    all_questions.extend(generate_amendment())
    all_questions.extend(generate_supersession())
    all_questions.extend(generate_conflicts())
    all_questions.extend(generate_multi_hop())

    # Validate
    warnings = 0
    for q in all_questions:
        for cid in q.get("source_clause_ids", []):
            if cid not in VALID_CLAUSE_IDS:
                print(f"  WARNING: {q['question_id']} references unknown clause {cid}")
                warnings += 1
        for did in q.get("source_document_ids", []):
            if did not in VALID_DOC_IDS:
                print(f"  WARNING: {q['question_id']} references unknown document {did}")
                warnings += 1

    # Split into questions and answers
    question_list = []
    answer_list = []
    for q in all_questions:
        question_list.append({
            "question_id": q["question_id"],
            "question": q["question"],
            "question_type": q["question_type"],
            "difficulty": q["difficulty"],
        })
        answer_list.append({
            "question_id": q["question_id"],
            "expected_answer": q["expected_answer"],
            "source_clause_ids": q["source_clause_ids"],
            "source_document_ids": q["source_document_ids"],
            "reasoning_required": q.get("reasoning_required", ""),
        })

    save_json(question_list, out_questions)
    save_json(answer_list, out_answers)

    # Stats
    types = {}
    difficulties = {}
    for q in all_questions:
        types[q["question_type"]] = types.get(q["question_type"], 0) + 1
        difficulties[q["difficulty"]] = difficulties.get(q["difficulty"], 0) + 1

    print(f"Validated: {len(all_questions)} questions, {warnings} warnings")
    print(f"\n=== Summary ===")
    print(f"Total questions: {len(all_questions)}")
    print(f"By type: {types}")
    print(f"By difficulty: {difficulties}")


if __name__ == "__main__":
    main()
