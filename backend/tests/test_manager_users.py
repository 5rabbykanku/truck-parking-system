def get_manager_token(client, seed_users):
    response = client.post("/auth/login", json={"email": "manager@test.com", "password": "ManagerPass123!"})
    return response.get_json()["access_token"]


def get_employee_token(client, seed_users):
    response = client.post("/auth/login", json={"email": "employee@test.com", "password": "EmployeePass123!"})
    return response.get_json()["access_token"]


def test_create_employee_success(client, seed_users):
    token = get_manager_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/manager/employees",
        json={"name": "New Employee", "email": "newemp@test.com", "password": "NewEmpPass123!"},
        headers=headers
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["name"] == "New Employee"
    assert data["is_active"] is True


def test_create_employee_duplicate_email(client, seed_users):
    token = get_manager_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/manager/employees",
        json={"name": "Dup", "email": "employee@test.com", "password": "DupPass123!"},
        headers=headers
    )

    assert response.status_code == 409


def test_list_employees_scoped_to_own_site(client, seed_users):
    token = get_manager_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/manager/employees", headers=headers)

    assert response.status_code == 200
    emails = [e["email"] for e in response.get_json()]
    assert "employee@test.com" in emails


def test_update_employee(client, seed_users):
    token = get_manager_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = client.post(
        "/manager/employees",
        json={"name": "Update Me", "email": "updateme@test.com", "password": "UpdatePass123!"},
        headers=headers
    )
    employee_id = create_response.get_json()["id"]

    response = client.put(f"/manager/employees/{employee_id}", json={"name": "Updated Name"}, headers=headers)

    assert response.status_code == 200
    assert response.get_json()["name"] == "Updated Name"


def test_deactivate_employee(client, seed_users):
    token = get_manager_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = client.post(
        "/manager/employees",
        json={"name": "Deactivate Me", "email": "deactivateme@test.com", "password": "DeactivatePass123!"},
        headers=headers
    )
    employee_id = create_response.get_json()["id"]

    response = client.delete(f"/manager/employees/{employee_id}", headers=headers)

    assert response.status_code == 200
    assert response.get_json()["is_active"] is False


def test_manager_cannot_update_employee_from_another_site(client, seed_users, app):
    from app.models import User, Site
    from app import db

    with app.app_context():
        other_site = Site(name="Other Site", total_spaces=10, hourly_rate=5, daily_rate=25)
        db.session.add(other_site)
        db.session.flush()

        other_employee = User(name="Other Employee", email="other@test.com", role="employee", site_id=other_site.id)
        other_employee.set_password("OtherPass123!")
        db.session.add(other_employee)
        db.session.commit()
        other_employee_id = other_employee.id

    token = get_manager_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.put(f"/manager/employees/{other_employee_id}", json={"name": "Hacked"}, headers=headers)

    assert response.status_code == 404


def test_manager_employee_endpoints_reject_employee_role(client, seed_users):
    token = get_employee_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/manager/employees", headers=headers)

    assert response.status_code == 403


def test_manager_employee_endpoints_require_token(client, seed_users):
    response = client.get("/manager/employees")
    assert response.status_code == 401

def test_update_employee_not_found(client, seed_users):
    token = get_manager_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.put("/manager/employees/99999", json={"name": "Ghost"}, headers=headers)

    assert response.status_code == 404


def test_deactivate_employee_not_found(client, seed_users):
    token = get_manager_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.delete("/manager/employees/99999", headers=headers)

    assert response.status_code == 404


def test_create_employee_missing_fields(client, seed_users):
    token = get_manager_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/manager/employees", json={"name": "Incomplete"}, headers=headers)

    assert response.status_code == 400
    
def test_cannot_edit_deactivated_employee(client, seed_users):
    token = get_manager_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = client.post(
        "/manager/employees",
        json={"name": "ToDeactivate3", "email": "deactivate3@test.com", "password": "DeactivatePass123!"},
        headers=headers
    )
    employee_id = create_response.get_json()["id"]
    client.delete(f"/manager/employees/{employee_id}", headers=headers)

    response = client.put(f"/manager/employees/{employee_id}", json={"name": "Trying"}, headers=headers)

    assert response.status_code == 400