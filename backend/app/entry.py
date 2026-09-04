import random
import io
import base64
import math
import qrcode
from datetime import datetime
def calculate_fee(entry_time, end_time, hourly_rate, daily_rate):
    hourly_rate = float(hourly_rate)
    daily_rate = float(daily_rate)

    duration_seconds = (end_time - entry_time).total_seconds()
    total_hours = math.ceil(duration_seconds / 3600)
    if total_hours < 1:
        total_hours = 1

    full_days = total_hours // 24
    remaining_hours = total_hours % 24

    fee = full_days * min(24 * hourly_rate, daily_rate)
    if remaining_hours > 0:
        fee += min(remaining_hours * hourly_rate, daily_rate)

    return round(fee, 2)
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app.decorators import requires_role
from app.models import Truck, Driver, ParkingSession, User
from app import db
def generate_qr_code(data):
    img = qrcode.make(data)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"
entry_bp = Blueprint("entry", __name__)
def generate_unique_parking_code():
    while True:
        code = str(random.randint(100000, 999999))
        exists = ParkingSession.query.filter_by(parking_code=code).first()
        if not exists:
            return code

@entry_bp.route("/sessions/entry", methods=["POST"])
@requires_role("employee")
def create_entry():
    data = request.get_json()

    required_fields = ["driver_name", "phone_number", "plate_number", "truck_type"]
    if not data or not all(data.get(f) for f in required_fields):
        return jsonify({"error": "driver_name, phone_number, plate_number, and truck_type are required"}), 400

    claims = get_jwt()
    employee_id = int(get_jwt_identity())
    site_id = claims.get("site_id")

    if not site_id:
        return jsonify({"error": "Employee is not assigned to a site"}), 400

    truck = Truck.query.filter_by(plate_number=data["plate_number"]).first()
    if not truck:
        truck = Truck(
            plate_number=data["plate_number"],
            truck_type=data["truck_type"]
        )
        db.session.add(truck)
        db.session.flush()

    driver = Driver.query.filter_by(phone_number=data["phone_number"]).first()
    if not driver:
        driver = Driver(
            name=data["driver_name"],
            phone_number=data["phone_number"]
        )
        db.session.add(driver)
        db.session.flush()

    parking_code = generate_unique_parking_code()

    session = ParkingSession(
        truck_id=truck.id,
        driver_id=driver.id,
        site_id=site_id,
        employee_id=employee_id,
        status="active",
        vehicle_photo_url=data.get("vehicle_photo_url"),
        driver_photo_url=data.get("driver_photo_url"),
        parking_code=parking_code,
        qr_code_data=generate_qr_code(parking_code)
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({
        "session_id": session.id,
        "parking_code": session.parking_code,
        "qr_code_data": session.qr_code_data,
        "truck": {"id": truck.id, "plate_number": truck.plate_number, "truck_type": truck.truck_type},
        "driver": {"id": driver.id, "name": driver.name, "phone_number": driver.phone_number},
        "entry_time": session.entry_time.isoformat(),
        "status": session.status
    }), 201

@entry_bp.route("/sessions/lookup/<code>", methods=["GET"])
@requires_role("employee")
def lookup_session(code):
    session = ParkingSession.query.filter_by(parking_code=code).first()

    if not session:
        return jsonify({"error": "No session found with that code"}), 404

    return jsonify({
        "session_id": session.id,
        "parking_code": session.parking_code,
        "status": session.status,
        "entry_time": session.entry_time.isoformat(),
        "exit_time": session.exit_time.isoformat() if session.exit_time else None,
        "truck": {
            "id": session.truck.id,
            "plate_number": session.truck.plate_number,
            "truck_type": session.truck.truck_type
        },
        "driver": {
            "id": session.driver.id,
            "name": session.driver.name,
            "phone_number": session.driver.phone_number
        }
    }), 200

@entry_bp.route("/sessions/lookup/<code>/fee", methods=["GET"])
@requires_role("employee")
def get_session_fee(code):
    session = ParkingSession.query.filter_by(parking_code=code).first()

    if not session:
        return jsonify({"error": "No session found with that code"}), 404

    end_time = session.exit_time if session.exit_time else datetime.utcnow()
    fee = calculate_fee(session.entry_time, end_time, session.site.hourly_rate, session.site.daily_rate)

    return jsonify({
        "parking_code": session.parking_code,
        "status": session.status,
        "entry_time": session.entry_time.isoformat(),
        "as_of": end_time.isoformat(),
        "calculated_fee": fee
    }), 200

@entry_bp.route("/sessions/lookup/<code>/pay", methods=["POST"])
@requires_role("employee")
def confirm_payment(code):
    data = request.get_json()

    if not data or not data.get("payment_method"):
        return jsonify({"error": "payment_method is required"}), 400

    valid_methods = ["cash", "card", "mobile"]
    if data["payment_method"] not in valid_methods:
        return jsonify({"error": f"payment_method must be one of {valid_methods}"}), 400

    session = ParkingSession.query.filter_by(parking_code=code).first()

    if not session:
        return jsonify({"error": "No session found with that code"}), 404

    if session.payment_confirmed_at:
        return jsonify({"error": "This session has already been paid"}), 400

    fee = calculate_fee(session.entry_time, datetime.utcnow(), session.site.hourly_rate, session.site.daily_rate)

    session.fee_amount = fee
    session.payment_method = data["payment_method"]
    session.payment_confirmed_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "parking_code": session.parking_code,
        "fee_amount": float(session.fee_amount),
        "payment_method": session.payment_method,
        "payment_confirmed_at": session.payment_confirmed_at.isoformat()
    }), 200

@entry_bp.route("/sessions/lookup/<code>/exit", methods=["POST"])
@requires_role("employee")
def process_exit(code):
    session = ParkingSession.query.filter_by(parking_code=code).first()

    if not session:
        return jsonify({"error": "No session found with that code"}), 404

    if session.status == "completed":
        return jsonify({"error": "This session has already been exited"}), 400

    if not session.payment_confirmed_at:
        return jsonify({"error": "Payment must be confirmed before exit"}), 400

    session.status = "completed"
    session.exit_time = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "parking_code": session.parking_code,
        "status": session.status,
        "entry_time": session.entry_time.isoformat(),
        "exit_time": session.exit_time.isoformat(),
        "fee_amount": float(session.fee_amount) if session.fee_amount else None,
        "payment_method": session.payment_method
    }), 200
