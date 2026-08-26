from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.models import User
from app.decorators import requires_role
from app import db
auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Account is disabled"}), 403

    additional_claims = {"role": user.role, "site_id": user.site_id}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "site_id": user.site_id
        }
    }), 200

@auth_bp.route("/auth/register", methods=["POST"])
@requires_role("admin")
def register():
    data = request.get_json()

    required_fields = ["name", "email", "password", "role"]
    if not data or not all(data.get(f) for f in required_fields):
        return jsonify({"error": "name, email, password, and role are required"}), 400

    if data["role"] not in ["admin", "manager", "employee"]:
        return jsonify({"error": "Role must be admin, manager, or employee"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already in use"}), 409

    user = User(
        name=data["name"],
        email=data["email"],
        role=data["role"],
        site_id=data.get("site_id")
    )
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "site_id": user.site_id
    }), 201