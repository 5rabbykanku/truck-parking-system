from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt
from app.decorators import requires_role
from app.models import User
from app import db

manager_users_bp = Blueprint("manager_users", __name__)


def get_manager_site_id():
    claims = get_jwt()
    return claims.get("site_id")


@manager_users_bp.route("/manager/employees", methods=["POST"])
@requires_role("manager")
def create_employee():
    site_id = get_manager_site_id()
    data = request.get_json()

    required_fields = ["name", "email", "password"]
    if not data or not all(data.get(f) for f in required_fields):
        return jsonify({"error": "name, email, and password are required"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already in use"}), 409

    employee = User(
        name=data["name"],
        email=data["email"],
        role="employee",
        site_id=site_id
    )
    employee.set_password(data["password"])
    db.session.add(employee)
    db.session.commit()

    return jsonify({
        "id": employee.id,
        "name": employee.name,
        "email": employee.email,
        "site_id": employee.site_id,
        "is_active": employee.is_active
    }), 201


@manager_users_bp.route("/manager/employees", methods=["GET"])
@requires_role("manager")
def list_employees():
    site_id = get_manager_site_id()
    employees = User.query.filter_by(role="employee", site_id=site_id).all()

    return jsonify([{
        "id": e.id,
        "name": e.name,
        "email": e.email,
        "is_active": e.is_active,
        "last_active_at": e.last_active_at.isoformat() if e.last_active_at else None
    } for e in employees]), 200


@manager_users_bp.route("/manager/employees/<int:employee_id>", methods=["PUT"])
@requires_role("manager")
def update_employee(employee_id):
    site_id = get_manager_site_id()
    employee = User.query.filter_by(id=employee_id, role="employee", site_id=site_id).first()
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    if not employee.is_active:
        return jsonify({"error": "Cannot edit a deactivated employee"}), 400

    data = request.get_json()
    if not data:
        return jsonify({"error": "No update data provided"}), 400

    if "name" in data:
        employee.name = data["name"]

    if "email" in data:
        existing = User.query.filter_by(email=data["email"]).first()
        if existing and existing.id != employee.id:
            return jsonify({"error": "Email already in use"}), 409
        employee.email = data["email"]

    db.session.commit()

    return jsonify({
        "id": employee.id,
        "name": employee.name,
        "email": employee.email,
        "is_active": employee.is_active
    }), 200


@manager_users_bp.route("/manager/employees/<int:employee_id>", methods=["DELETE"])
@requires_role("manager")
def deactivate_employee(employee_id):
    site_id = get_manager_site_id()
    employee = User.query.filter_by(id=employee_id, role="employee", site_id=site_id).first()
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    employee.is_active = False
    db.session.commit()

    return jsonify({"id": employee.id, "is_active": employee.is_active}), 200