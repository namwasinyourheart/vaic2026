import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture
def sample_metadata():
    return {
        "document_id": "CRD-C01",
        "type": "ContractTemplate",
        "domain": "CRD",
        "version": "1.0",
        "effective_date": "2024-01-01",
        "expiry_date": "2029-01-01",
        "status": "Active",
        "language": "vi",
        "access_level": "Internal",
        "owner_department": "Credit",
    }


@pytest.fixture
def sample_md_text():
    return """---
document_id: CRD-C01
type: ContractTemplate
domain: CRD
version: "1.0"
effective_date: "2024-01-01"
expiry_date: "2029-01-01"
---

## 3. Điều khoản tài chính

**CRD-C01-3.1.** Lãi suất áp dụng cho khoản vay là 9,0%/năm (fixed), được tính trên số dư còn lại theo phương pháp giảm dần mỗi tháng.

**CRD-C01-3.2.** Phí xử lý hồ sơ vay là 1,0% của số tiền vay (tối thiểu 500.000 VND, tối đa 5.000.000 VND).
"""


@pytest.fixture
def sample_clauses_meta():
    return {
        "CRD-C01-3.1": {
            "clause_id": "CRD-C01-3.1",
            "document_id": "CRD-C01",
            "effective_date": None,
            "expiry_date": None,
            "amended_by": None,
            "superseded_by": None,
            "conflicts_with": [],
        },
        "CRD-C01-3.2": {
            "clause_id": "CRD-C01-3.2",
            "document_id": "CRD-C01",
            "effective_date": "2024-06-01",
            "expiry_date": None,
            "amended_by": None,
            "superseded_by": None,
            "conflicts_with": ["AML-P01-3.2"],
        },
    }


@pytest.fixture
def sample_evidence_chunks():
    return [
        {
            "chunk_id": "CRD-C01-3.1",
            "document_id": "CRD-C01",
            "section_title": "Điều khoản tài chính",
            "text": "Lãi suất áp dụng cho khoản vay là 9,0%/năm (fixed).",
        },
        {
            "chunk_id": "LGP-P01-2.2",
            "document_id": "LGP-P01",
            "section_title": "Quy trình phê duyệt",
            "text": "Giới hạn tối đa cho vay trung hạn không vượt quá 9,0%/năm.",
        },
    ]


@pytest.fixture
def sample_conflicts():
    return [{"clause_a": "CRD-R01-v2-3.2", "clause_b": "AML-P01-3.2"}]
