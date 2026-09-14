def get_admin_token(client, seed_users):
    response = client.post("/auth/login", json={"email": "admin@test.com", "password": "AdminPass123!"})
    return response.get_json()["access_token"]


def get_manager_token(client, seed_users):
    response = client.post("/auth/login", json={"email": "manager@test.com", "password": "ManagerPass123!"})
    return response.get_json()["access_token"]


def create_site(client, admin_headers, name="New Site"):
    response = client.post(
        "/admin/sites",
        json={"name": name, "total_spaces": 20, "hourly_rate": 5, "daily_rate": 25},
        headers=admin_headers
    )
    return response.get_json()


def test_create_site_success(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/admin/sites",
        json={"name": "Second Site", "total_spaces": 25, "hourly_rate": 6, "daily_rate": 30},
        headers=headers
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["name"] == "Second Site"
    assert data["is_active"] is True


def test_create_site_missing_fields(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/admin/sites", json={"name": "Incomplete"}, headers=headers)

    assert response.status_code == 400


def test_update_site(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}
    site = create_site(client, headers)

    response = client.put(f"/admin/sites/{site['id']}", json={"total_spaces": 100}, headers=headers)

    assert response.status_code == 200
    assert response.get_json()["total_spaces"] == 100


def test_deactivate_site(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}
    site = create_site(client, headers)

    response = client.delete(f"/admin/sites/{site['id']}", headers=headers)

    assert response.status_code == 200
    assert response.get_json()["is_active"] is False


def test_create_manager_success(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}
    site = create_site(client, headers)

    response = client.post(
        "/admin/managers",
        json={"name": "New Manager", "email": "newmgr@test.com", "password": "NewMgrPass123!", "site_id": site["id"]},
        headers=headers
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["site_id"] == site["id"]


def test_create_manager_rejects_site_with_existing_manager(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}
    site = create_site(client, headers, name="Site With Manager")

    client.post(
        "/admin/managers",
        json={"name": "First Manager", "email": "first@test.com", "password": "FirstPass123!", "site_id": site["id"]},
        headers=headers
    )

    response = client.post(
        "/admin/managers",
        json={"name": "Dup Manager", "email": "dupmgr@test.com", "password": "DupMgrPass123!", "site_id": site["id"]},
        headers=headers
    )

    assert response.status_code == 400


def test_list_managers(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/admin/managers", headers=headers)

    assert response.status_code == 200
    emails = [m["email"] for m in response.get_json()]
    assert "manager@test.com" in emails


def test_update_manager_reassigns_site(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}
    new_site = create_site(client, headers, name="Reassign Target")

    create_response = client.post(
        "/admin/managers",
        json={"name": "Movable Manager", "email": "movable@test.com", "password": "MovablePass123!", "site_id": new_site["id"]},
        headers=headers
    )
    manager_id = create_response.get_json()["id"]

    another_site = create_site(client, headers, name="Another Target")
    response = client.put(f"/admin/managers/{manager_id}", json={"site_id": another_site["id"]}, headers=headers)

    assert response.status_code == 200
    assert response.get_json()["site_id"] == another_site["id"]


def test_deactivate_manager(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}
    site = create_site(client, headers)

    create_response = client.post(
        "/admin/managers",
        json={"name": "ToDeactivate", "email": "deactivate@test.com", "password": "DeactivatePass123!", "site_id": site["id"]},
        headers=headers
    )
    manager_id = create_response.get_json()["id"]

    response = client.delete(f"/admin/managers/{manager_id}", headers=headers)

    assert response.status_code == 200
    assert response.get_json()["is_active"] is False


def test_admin_endpoints_reject_manager(client, seed_users):
    token = get_manager_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/admin/managers", headers=headers)

    assert response.status_code == 403


def test_admin_endpoints_require_token(client, seed_users):
    response = client.get("/admin/managers")
    assert response.status_code == 401

def test_update_site_not_found(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.put("/admin/sites/99999", json={"name": "Ghost"}, headers=headers)

    assert response.status_code == 404


def test_deactivate_site_not_found(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.delete("/admin/sites/99999", headers=headers)

    assert response.status_code == 404


def test_update_manager_not_found(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.put("/admin/managers/99999", json={"name": "Ghost"}, headers=headers)

    assert response.status_code == 404


def test_deactivate_manager_not_found(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.delete("/admin/managers/99999", headers=headers)

    assert response.status_code == 404


def test_create_manager_nonexistent_site(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/admin/managers",
        json={"name": "Orphan Manager", "email": "orphan@test.com", "password": "OrphanPass123!", "site_id": 99999},
        headers=headers
    )

    assert response.status_code == 404


def test_update_manager_reassign_to_nonexistent_site(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}
    site = create_site(client, headers)

    create_response = client.post(
        "/admin/managers",
        json={"name": "Reassign Test", "email": "reassigntest@test.com", "password": "ReassignPass123!", "site_id": site["id"]},
        headers=headers
    )
    manager_id = create_response.get_json()["id"]

    response = client.put(f"/admin/managers/{manager_id}", json={"site_id": 99999}, headers=headers)

    assert response.status_code == 404

def test_cannot_edit_deactivated_manager(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}
    site = create_site(client, headers)

    create_response = client.post(
        "/admin/managers",
        json={"name": "ToDeactivate2", "email": "deactivate2@test.com", "password": "DeactivatePass123!", "site_id": site["id"]},
        headers=headers
    )
    manager_id = create_response.get_json()["id"]
    client.delete(f"/admin/managers/{manager_id}", headers=headers)

    response = client.put(f"/admin/managers/{manager_id}", json={"name": "Trying"}, headers=headers)

    assert response.status_code == 400


def test_cannot_edit_deactivated_site(client, seed_users):
    token = get_admin_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}
    site = create_site(client, headers)
    client.delete(f"/admin/sites/{site['id']}", headers=headers)

    response = client.put(f"/admin/sites/{site['id']}", json={"name": "Trying"}, headers=headers)

    assert response.status_code == 400