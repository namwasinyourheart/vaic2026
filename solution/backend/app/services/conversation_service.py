"""Conversation domain service boundary."""

from .ai_adapter import AIServiceAdapter, get_ai_adapter

__all__ = ["AIServiceAdapter", "get_ai_adapter"]
