from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv(Path(__file__).parent / ".env")
load_dotenv(Path(__file__).parent.parent.parent / "data_prep" / "src" / ".env")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
LLM_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"
LLM_BASE_URL = "https://openrouter.ai/api/v1"
LLM_TEMPERATURE = 0.7
LLM_MAX_TOKENS = 4096

EMBEDDING_MODEL = "Qwen/Qwen3-Embedding-0.6B"
EMBEDDING_DIM = 1024

QDRANT_COLLECTION = "banking_clauses"
QDRANT_PATH = str(Path(__file__).parent / "qdrant_storage")

NEO4J_URI = os.getenv("NEO4J_URI", "")
NEO4J_USER = os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")

DATASET_DIR = Path(__file__).parent.parent.parent / "data_prep" / "output" / "dataset" / "nvidia-nemotron-3-super-120b-a12b-free"
DOCS_DIR = DATASET_DIR / "documents"
METADATA_DIR = DATASET_DIR / "metadata"
GRAPH_DIR = DATASET_DIR / "graph"
BENCHMARK_DIR = DATASET_DIR / "benchmark"
GROUND_TRUTH_DIR = DATASET_DIR / "ground_truth"

RETRY_ATTEMPTS = 3
RETRY_DELAY = 2.0
REQUEST_DELAY = 0.5
