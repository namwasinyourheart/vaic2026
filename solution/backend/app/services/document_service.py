"""Document domain service boundary for future HTTP/controller separation."""

from .storage_service import StorageService, get_storage

__all__ = ["StorageService", "get_storage"]
