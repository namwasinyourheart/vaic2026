from io import BytesIO

import pytest

from app.services.storage_service import LocalStorageAdapter


@pytest.mark.asyncio
async def test_local_storage_lifecycle(tmp_path) -> None:
    storage = LocalStorageAdapter(tmp_path)
    stored = await storage.upload(
        BytesIO(b"bank-file"), "documents/test/v1/file.pdf", "application/pdf"
    )
    assert stored.size == 9
    assert await storage.exists(stored.key)
    stream = await storage.download(stored.key)
    try:
        assert stream.read() == b"bank-file"
    finally:
        stream.close()
    await storage.delete(stored.key)
    assert not await storage.exists(stored.key)


@pytest.mark.asyncio
async def test_storage_rejects_path_traversal(tmp_path) -> None:
    storage = LocalStorageAdapter(tmp_path)
    with pytest.raises(ValueError):
        await storage.upload(BytesIO(b"x"), "../outside.txt", "text/plain")
