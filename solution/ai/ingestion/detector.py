import re

CLAUSE_ID_PATTERN = re.compile(r"\*\*[A-Z]{2,4}-[A-Z]\d{2}(?:-v\d+)?-\d+\.\d+")
CLAUSE_ID_VARIANT = re.compile(r"###\s*CLAUSE:")
NUMBERED_ITEMS = re.compile(r"^\d+\.\d+\s", re.MULTILINE)
QUESTION_PATTERN = re.compile(r"^(?:Q[:.]|Câu hỏi|###?\s*Q\d+|\*\*.*\?\*\*)", re.MULTILINE)
HEADER_PATTERN = re.compile(r"^##\s+", re.MULTILINE)
TABLE_PATTERN = re.compile(r"^\|.+\|$", re.MULTILINE)

CLAUSE_TYPES = {"Regulation", "Policy", "Contract", "ContractTemplate", "Circular", "Notice", "Guideline"}
SECTION_TYPES = {"SOP", "Guideline"}
QA_TYPES = {"FAQ"}
TABLE_TYPES = {"FinancialReport", "RateTable"}

FORMAL_TYPES = CLAUSE_TYPES | SECTION_TYPES | QA_TYPES


def detect_format(md_text: str, doc_type: str = "") -> str:
    if CLAUSE_ID_PATTERN.search(md_text) or CLAUSE_ID_VARIANT.search(md_text):
        return "clause"
    if doc_type in CLAUSE_TYPES:
        return "clause"
    if doc_type in QA_TYPES:
        return "qa"
    if doc_type in TABLE_TYPES:
        return "table"
    if QUESTION_PATTERN.search(md_text):
        return "qa"
    if HEADER_PATTERN.search(md_text):
        return "section"
    return "paragraph"
