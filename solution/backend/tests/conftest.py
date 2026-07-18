import asyncio

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.seed import seed


@pytest.fixture(scope="session", autouse=True)
def seeded_database() -> None:
    asyncio.run(seed())


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def login(client: TestClient):
    def _login(username: str, password: str = "password") -> dict:
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": username,
                "password": password,
            },
        )
        assert response.status_code == 200, response.text
        return response.json()

    return _login
