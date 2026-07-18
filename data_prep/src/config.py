from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv(Path(__file__).parent / ".env")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
LLM_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"
LLM_BASE_URL = "https://openrouter.ai/api/v1"
LLM_TEMPERATURE = 0.7
LLM_MAX_TOKENS = 4096

SRC_DIR = Path(__file__).parent
MODEL_DIR_NAME = LLM_MODEL.replace("/", "-").replace(":", "-")
OUTPUT_DIR = SRC_DIR.parent / "output" / "dataset" / MODEL_DIR_NAME

DOCS_DIR = OUTPUT_DIR / "documents"
METADATA_DIR = OUTPUT_DIR / "metadata"
GRAPH_DIR = OUTPUT_DIR / "graph"
BENCHMARK_DIR = OUTPUT_DIR / "benchmark"
GROUND_TRUTH_DIR = OUTPUT_DIR / "ground_truth"

RETRY_ATTEMPTS = 3
RETRY_DELAY = 2.0
REQUEST_DELAY = 0.5
