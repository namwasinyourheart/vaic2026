import hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO, Protocol

from ..config import get_settings


@dataclass
class StoredFile:
    key: str
    size: int
    checksum_sha256: str
    provider: str = "local"
    bucket: str | None = None


class StorageService(Protocol):
    async def upload(self, file: BinaryIO, key: str, content_type: str) -> StoredFile: ...
    async def download(self, key: str) -> BinaryIO: ...
    async def delete(self, key: str) -> None: ...
    async def exists(self, key: str) -> bool: ...


class LocalStorageAdapter:
    def __init__(self, root: str | Path | None = None) -> None:
        self.root = Path(root or get_settings().local_storage_path)
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        path = (self.root / key).resolve()
        root = self.root.resolve()
        if root not in path.parents:
            raise ValueError("Invalid storage key")
        return path

    async def upload(self, file: BinaryIO, key: str, content_type: str) -> StoredFile:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        digest = hashlib.sha256()
        size = 0
        with path.open("wb") as output:
            while chunk := file.read(1024 * 1024):
                output.write(chunk)
                digest.update(chunk)
                size += len(chunk)
        return StoredFile(key, size, digest.hexdigest())

    async def download(self, key: str) -> BinaryIO:
        return self._path(key).open("rb")

    async def delete(self, key: str) -> None:
        path = self._path(key)
        if path.exists():
            path.unlink()

    async def exists(self, key: str) -> bool:
        return self._path(key).exists()


class R2StorageAdapter:
    """Cloudflare R2 adapter boundary.

    The POC intentionally does not install an S3 client. Enabling ``r2`` fails
    fast instead of silently writing files locally. Add boto3/aioboto3 here when
    production credentials and bucket policies are available.
    """

    def __init__(self) -> None:
        raise RuntimeError("R2 storage is not enabled in the POC. Configure an S3 client first.")

    async def upload(self, file: BinaryIO, key: str, content_type: str) -> StoredFile:
        raise NotImplementedError

    async def download(self, key: str) -> BinaryIO:
        raise NotImplementedError

    async def delete(self, key: str) -> None:
        raise NotImplementedError

    async def exists(self, key: str) -> bool:
        raise NotImplementedError


def get_storage() -> StorageService:
    if get_settings().storage_backend == "r2":
        return R2StorageAdapter()
    return LocalStorageAdapter()
