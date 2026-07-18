from app.services.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_hash_and_verify() -> None:
    digest = hash_password("secret")
    assert digest.startswith("$2")
    assert verify_password("secret", digest)
    assert not verify_password("wrong", digest)


def test_access_token_round_trip() -> None:
    token = create_access_token("user-123")
    assert decode_access_token(token) == "user-123"


def test_login_refresh_logout(client, login) -> None:
    session = login("customer")
    headers = {"Authorization": f"Bearer {session['access_token']}"}
    assert client.get("/api/v1/auth/me", headers=headers).status_code == 200
    refreshed = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": session["refresh_token"]},
    )
    assert refreshed.status_code == 200
    assert (
        client.post(
            "/api/v1/auth/logout",
            headers=headers,
            json={"refresh_token": session["refresh_token"]},
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": session["refresh_token"]},
        ).status_code
        == 401
    )


def test_wrong_role_is_forbidden(client, login) -> None:
    session = login("customer")
    headers = {"Authorization": f"Bearer {session['access_token']}"}
    assert client.get("/api/v1/admin/users", headers=headers).status_code == 403
