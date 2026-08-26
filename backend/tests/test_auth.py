def test_login_success_all_roles(client, seed_users):
    for email, password, role in [
        ("admin@test.com", "AdminPass123!", "admin"),
        ("manager@test.com", "ManagerPass123!", "manager"),
        ("employee@test.com", "EmployeePass123!", "employee"),
    ]:
        response = client.post("/auth/login", json={"email": email, "password": password})
        assert response.status_code == 200
        data = response.get_json()
        assert "access_token" in data
        assert data["user"]["role"] == role


def test_login_wrong_password(client, seed_users):
    response = client.post("/auth/login", json={"email": "admin@test.com", "password": "WrongPassword"})
    assert response.status_code == 401
    assert response.get_json()["error"] == "Invalid email or password"


def test_login_missing_fields(client, seed_users):
    response = client.post("/auth/login", json={"email": "admin@test.com"})
    assert response.status_code == 400


def test_register_requires_token(client, seed_users):
    response = client.post("/auth/register", json={
        "name": "New User", "email": "new@test.com", "password": "Pass123!", "role": "employee"
    })
    assert response.status_code == 401


def test_register_rejects_non_admin(client, seed_users):
    login_response = client.post("/auth/login", json={"email": "employee@test.com", "password": "EmployeePass123!"})
    token = login_response.get_json()["access_token"]

    response = client.post(
        "/auth/register",
        json={"name": "New User", "email": "new@test.com", "password": "Pass123!", "role": "manager"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403


def test_register_allows_admin(client, seed_users):
    login_response = client.post("/auth/login", json={"email": "admin@test.com", "password": "AdminPass123!"})
    token = login_response.get_json()["access_token"]

    response = client.post(
        "/auth/register",
        json={"name": "New User", "email": "new@test.com", "password": "Pass123!", "role": "manager"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    assert response.get_json()["email"] == "new@test.com"