import asyncio
import hashlib
from dataclasses import dataclass
from io import BytesIO
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
    """Cloudflare R2 adapter using the S3-compatible boto3 API."""

    def __init__(self) -> None:
        settings = get_settings()
        missing = [
            name
            for name, value in {
                "R2_ACCESS_KEY_ID": settings.r2_access_key_id,
                "R2_SECRET_ACCESS_KEY": settings.r2_secret_access_key,
                "R2_BUCKET": settings.r2_bucket,
                "R2_ENDPOINT": settings.r2_endpoint,
            }.items()
            if not value
        ]
        if missing:
            raise RuntimeError(f"R2 storage is missing configuration: {', '.join(missing)}")
        import boto3

        self.bucket = settings.r2_bucket
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.r2_endpoint,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            region_name="auto",
        )

    async def upload(self, file: BinaryIO, key: str, content_type: str) -> StoredFile:
        content = file.read()
        digest = hashlib.sha256(content).hexdigest()
        await asyncio.to_thread(
            self.client.put_object,
            Bucket=self.bucket,
            Key=key,
            Body=content,
            ContentType=content_type,
        )
        return StoredFile(key, len(content), digest, provider="r2", bucket=self.bucket)

    async def download(self, key: str) -> BinaryIO:
        result = await asyncio.to_thread(self.client.get_object, Bucket=self.bucket, Key=key)
        return BytesIO(result["Body"].read())

    async def delete(self, key: str) -> None:
        await asyncio.to_thread(self.client.delete_object, Bucket=self.bucket, Key=key)

    async def exists(self, key: str) -> bool:
        try:
            await asyncio.to_thread(self.client.head_object, Bucket=self.bucket, Key=key)
            return True
        except Exception:
            return False


def get_storage() -> StorageService:
    if get_settings().storage_backend == "r2":
        return R2StorageAdapter()
    return LocalStorageAdapter()
