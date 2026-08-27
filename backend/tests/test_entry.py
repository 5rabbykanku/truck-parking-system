def get_employee_token(client, seed_users):
    response = client.post("/auth/login", json={"email": "employee@test.com", "password": "EmployeePass123!"})
    return response.get_json()["access_token"]


def test_create_entry_success(client, seed_users):
    token = get_employee_token(client, seed_users)

    response = client.post(
        "/sessions/entry",
        json={
            "driver_name": "John Doe",
            "phone_number": "555-1234",
            "plate_number": "TRK-001",
            "truck_type": "Flatbed"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 201
    data = response.get_json()
    assert "parking_code" in data
    assert len(data["parking_code"]) == 6
    assert data["qr_code_data"].startswith("data:image/png;base64,")
    assert data["status"] == "active"
    assert data["truck"]["plate_number"] == "TRK-001"
    assert data["driver"]["phone_number"] == "555-1234"


def test_parking_codes_are_unique(client, seed_users):
    token = get_employee_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    codes = []
    for i in range(5):
        response = client.post(
            "/sessions/entry",
            json={
                "driver_name": f"Driver {i}",
                "phone_number": f"555-000{i}",
                "plate_number": f"TRK-{i}",
                "truck_type": "Flatbed"
            },
            headers=headers
        )
        codes.append(response.get_json()["parking_code"])

    assert len(codes) == len(set(codes))


def test_reuses_existing_truck_by_plate(client, seed_users):
    token = get_employee_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response1 = client.post(
        "/sessions/entry",
        json={"driver_name": "Driver A", "phone_number": "555-1111", "plate_number": "TRK-SAME", "truck_type": "Flatbed"},
        headers=headers
    )
    response2 = client.post(
        "/sessions/entry",
        json={"driver_name": "Driver B", "phone_number": "555-2222", "plate_number": "TRK-SAME", "truck_type": "Flatbed"},
        headers=headers
    )

    truck_id_1 = response1.get_json()["truck"]["id"]
    truck_id_2 = response2.get_json()["truck"]["id"]

    assert truck_id_1 == truck_id_2


def test_reuses_existing_driver_by_phone(client, seed_users):
    token = get_employee_token(client, seed_users)
    headers = {"Authorization": f"Bearer {token}"}

    response1 = client.post(
        "/sessions/entry",
        json={"driver_name": "Same Driver", "phone_number": "555-3333", "plate_number": "TRK-A", "truck_type": "Flatbed"},
        headers=headers
    )
    response2 = client.post(
        "/sessions/entry",
        json={"driver_name": "Same Driver", "phone_number": "555-3333", "plate_number": "TRK-B", "truck_type": "Flatbed"},
        headers=headers
    )

    driver_id_1 = response1.get_json()["driver"]["id"]
    driver_id_2 = response2.get_json()["driver"]["id"]

    assert driver_id_1 == driver_id_2


def test_missing_required_fields(client, seed_users):
    token = get_employee_token(client, seed_users)

    response = client.post(
        "/sessions/entry",
        json={"driver_name": "Incomplete Driver", "phone_number": "555-9999"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 400


def test_entry_requires_token(client, seed_users):
    response = client.post(
        "/sessions/entry",
        json={"driver_name": "No Auth", "phone_number": "555-0000", "plate_number": "TRK-X", "truck_type": "Flatbed"}
    )
    assert response.status_code == 401


def test_entry_rejects_non_employee(client, seed_users):
    login_response = client.post("/auth/login", json={"email": "admin@test.com", "password": "AdminPass123!"})
    token = login_response.get_json()["access_token"]

    response = client.post(
        "/sessions/entry",
        json={"driver_name": "Admin Trying", "phone_number": "555-0000", "plate_number": "TRK-X", "truck_type": "Flatbed"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 403