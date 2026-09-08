from datetime import datetime, timedelta
from app.models import ParkingSession
from app import db


def get_manager_token(client, seed_users):
    response = client.post("/auth/login", json={"email": "manager@test.com", "password": "ManagerPass123!"})
    return response.get_json()["access_token"]


def get_employee_token(client, seed_users):
    response = client.post("/auth/login", json={"email": "employee@test.com", "password": "EmployeePass123!"})
    return response.get_json()["access_token"]


def create_entry(client, employee_headers, plate="TRK-D1", phone="555-1000"):
    response = client.post(
        "/sessions/entry",
        json={"driver_name": "Dash Driver", "phone_number": phone, "plate_number": plate, "truck_type": "Flatbed"},
        headers=employee_headers
    )
    return response.get_json()["parking_code"]


def test_currently_parked_shows_active_sessions(client, seed_users):
    employee_token = get_employee_token(client, seed_users)
    employee_headers = {"Authorization": f"Bearer {employee_token}"}
    create_entry(client, employee_headers)

    manager_token = get_manager_token(client, seed_users)
    manager_headers = {"Authorization": f"Bearer {manager_token}"}

    response = client.get("/dashboard/current", headers=manager_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["truck"]["plate_number"] == "TRK-D1"


def test_available_spaces_calculation(client, seed_users):
    employee_token = get_employee_token(client, seed_users)
    employee_headers = {"Authorization": f"Bearer {employee_token}"}
    create_entry(client, employee_headers, plate="TRK-D2", phone="555-1001")
    create_entry(client, employee_headers, plate="TRK-D3", phone="555-1002")

    manager_token = get_manager_token(client, seed_users)
    manager_headers = {"Authorization": f"Bearer {manager_token}"}

    response = client.get("/dashboard/spaces", headers=manager_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert data["occupied"] == 2
    assert data["available"] == data["total_spaces"] - 2


def test_today_activity_counts_entries_and_exits(client, seed_users):
    employee_token = get_employee_token(client, seed_users)
    employee_headers = {"Authorization": f"Bearer {employee_token}"}
    code = create_entry(client, employee_headers, plate="TRK-D4", phone="555-1003")

    client.post(f"/sessions/lookup/{code}/pay", json={"payment_method": "cash"}, headers=employee_headers)
    client.post(f"/sessions/lookup/{code}/exit", headers=employee_headers)

    manager_token = get_manager_token(client, seed_users)
    manager_headers = {"Authorization": f"Bearer {manager_token}"}

    response = client.get("/dashboard/today", headers=manager_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert data["entries"] >= 1
    assert data["exits"] >= 1


def test_revenue_totals_today(client, seed_users):
    employee_token = get_employee_token(client, seed_users)
    employee_headers = {"Authorization": f"Bearer {employee_token}"}
    code = create_entry(client, employee_headers, plate="TRK-D5", phone="555-1004")
    client.post(f"/sessions/lookup/{code}/pay", json={"payment_method": "cash"}, headers=employee_headers)

    manager_token = get_manager_token(client, seed_users)
    manager_headers = {"Authorization": f"Bearer {manager_token}"}

    response = client.get("/dashboard/revenue", headers=manager_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert data["payment_count"] >= 1
    assert data["total_revenue"] >= 5.0


def test_history_filters_by_date_range(client, seed_users, app):
    employee_token = get_employee_token(client, seed_users)
    employee_headers = {"Authorization": f"Bearer {employee_token}"}
    code = create_entry(client, employee_headers, plate="TRK-D6", phone="555-1005")

    with app.app_context():
        session = ParkingSession.query.filter_by(parking_code=code).first()
        session.entry_time = datetime.utcnow() - timedelta(days=10)
        db.session.commit()

    manager_token = get_manager_token(client, seed_users)
    manager_headers = {"Authorization": f"Bearer {manager_token}"}

    today_response = client.get("/dashboard/history", headers=manager_headers)
    today_codes = [s["parking_code"] for s in today_response.get_json()]
    assert code not in today_codes

    old_date = (datetime.utcnow() - timedelta(days=10)).date().isoformat()
    old_response = client.get(f"/dashboard/history?start={old_date}&end={old_date}", headers=manager_headers)
    old_codes = [s["parking_code"] for s in old_response.get_json()]
    assert code in old_codes


def test_dashboard_requires_token(client, seed_users):
    response = client.get("/dashboard/current")
    assert response.status_code == 401


def test_dashboard_current_allows_employee(client, seed_users):
    employee_token = get_employee_token(client, seed_users)
    headers = {"Authorization": f"Bearer {employee_token}"}

    response = client.get("/dashboard/current", headers=headers)

    assert response.status_code == 200


def test_dashboard_manager_only_endpoints_reject_employee(client, seed_users):
    employee_token = get_employee_token(client, seed_users)
    headers = {"Authorization": f"Bearer {employee_token}"}

    response = client.get("/dashboard/spaces", headers=headers)

    assert response.status_code == 403
    
def get_admin_token(client, seed_users):
    response = client.post("/auth/login", json={"email": "admin@test.com", "password": "AdminPass123!"})
    return response.get_json()["access_token"]


def test_admin_sites_summary(client, seed_users):
    employee_token = get_employee_token(client, seed_users)
    employee_headers = {"Authorization": f"Bearer {employee_token}"}
    create_entry(client, employee_headers, plate="TRK-A1", phone="555-2000")

    admin_token = get_admin_token(client, seed_users)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.get("/admin/sites", headers=admin_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) >= 1
    site = data[0]
    assert "name" in site
    assert "occupied" in site
    assert "available" in site
    assert "today_revenue" in site


def test_admin_site_current_drill_down(client, seed_users):
    employee_token = get_employee_token(client, seed_users)
    employee_headers = {"Authorization": f"Bearer {employee_token}"}
    create_entry(client, employee_headers, plate="TRK-A2", phone="555-2001")

    admin_token = get_admin_token(client, seed_users)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    site_id = seed_users["site_id"]
    response = client.get(f"/admin/sites/{site_id}/current", headers=admin_headers)

    assert response.status_code == 200
    plates = [s["truck"]["plate_number"] for s in response.get_json()]
    assert "TRK-A2" in plates


def test_admin_site_history_drill_down(client, seed_users):
    employee_token = get_employee_token(client, seed_users)
    employee_headers = {"Authorization": f"Bearer {employee_token}"}
    create_entry(client, employee_headers, plate="TRK-A3", phone="555-2002")

    admin_token = get_admin_token(client, seed_users)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    site_id = seed_users["site_id"]
    response = client.get(f"/admin/sites/{site_id}/history", headers=admin_headers)

    assert response.status_code == 200
    codes = [s["parking_code"] for s in response.get_json()]
    assert len(codes) >= 1


def test_admin_endpoints_reject_manager(client, seed_users):
    manager_token = get_manager_token(client, seed_users)
    headers = {"Authorization": f"Bearer {manager_token}"}

    response = client.get("/admin/sites", headers=headers)

    assert response.status_code == 403


def test_admin_endpoints_require_token(client, seed_users):
    response = client.get("/admin/sites")
    assert response.status_code == 401