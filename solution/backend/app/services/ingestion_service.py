"""Ingestion orchestration contracts.

The API schedules this work with FastAPI BackgroundTasks in the POC. A queue
worker can call the same adapter contract later without changing persistence.
"""

from .ai_adapter import AIServiceAdapter, IngestionResult, get_ai_adapter

__all__ = ["AIServiceAdapter", "IngestionResult", "get_ai_adapter"]
