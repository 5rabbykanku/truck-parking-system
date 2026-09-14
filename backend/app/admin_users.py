from flask import Blueprint, request, jsonify
from app.decorators import requires_role
from app.models import User, Site
from app import db
from werkzeug.security import generate_password_hash

admin_users_bp = Blueprint("admin_users", __name__)


@admin_users_bp.route("/admin/managers", methods=["POST"])
@requires_role("admin")
def create_manager():
    data = request.get_json()

    required_fields = ["name", "email", "password", "site_id"]
    if not data or not all(data.get(f) for f in required_fields):
        return jsonify({"error": "name, email, password, and site_id are required"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already in use"}), 409

    site = Site.query.get(data["site_id"])
    if not site:
        return jsonify({"error": "Site not found"}), 404

    if site.manager_id:
        return jsonify({"error": "This site already has a manager"}), 400

    manager = User(
        name=data["name"],
        email=data["email"],
        role="manager",
        site_id=data["site_id"]
    )
    manager.set_password(data["password"])
    db.session.add(manager)
    db.session.flush()

    site.manager_id = manager.id
    db.session.commit()

    return jsonify({
        "id": manager.id,
        "name": manager.name,
        "email": manager.email,
        "site_id": manager.site_id,
        "is_active": manager.is_active
    }), 201


@admin_users_bp.route("/admin/managers", methods=["GET"])
@requires_role("admin")
def list_managers():
    managers = User.query.filter_by(role="manager").all()

    return jsonify([{
        "id": m.id,
        "name": m.name,
        "email": m.email,
        "site_id": m.site_id,
        "site_name": m.site.name if m.site else None,
        "is_active": m.is_active
    } for m in managers]), 200


@admin_users_bp.route("/admin/managers/<int:manager_id>", methods=["PUT"])
@requires_role("admin")
def update_manager(manager_id):
    manager = User.query.filter_by(id=manager_id, role="manager").first()
    if not manager:
        return jsonify({"error": "Manager not found"}), 404

    if not manager.is_active:
        return jsonify({"error": "Cannot edit a deactivated manager"}), 400

    data = request.get_json()
    if not data:
        return jsonify({"error": "No update data provided"}), 400

    if "name" in data:
        manager.name = data["name"]

    if "email" in data:
        existing = User.query.filter_by(email=data["email"]).first()
        if existing and existing.id != manager.id:
            return jsonify({"error": "Email already in use"}), 409
        manager.email = data["email"]

    if "site_id" in data and data["site_id"] != manager.site_id:
        new_site = Site.query.get(data["site_id"])
        if not new_site:
            return jsonify({"error": "Site not found"}), 404
        if new_site.manager_id:
            return jsonify({"error": "This site already has a manager"}), 400

        old_site = Site.query.get(manager.site_id)
        if old_site:
            old_site.manager_id = None

        manager.site_id = new_site.id
        new_site.manager_id = manager.id

    db.session.commit()

    return jsonify({
        "id": manager.id,
        "name": manager.name,
        "email": manager.email,
        "site_id": manager.site_id,
        "is_active": manager.is_active
    }), 200


@admin_users_bp.route("/admin/managers/<int:manager_id>", methods=["DELETE"])
@requires_role("admin")
def deactivate_manager(manager_id):
    manager = User.query.filter_by(id=manager_id, role="manager").first()
    if not manager:
        return jsonify({"error": "Manager not found"}), 404

    manager.is_active = False
    db.session.commit()

    return jsonify({"id": manager.id, "is_active": manager.is_active}), 200

@admin_users_bp.route("/admin/sites", methods=["POST"])
@requires_role("admin")
def create_site():
    data = request.get_json()

    required_fields = ["name", "total_spaces", "hourly_rate", "daily_rate"]
    if not data or not all(f in data for f in required_fields):
        return jsonify({"error": "name, total_spaces, hourly_rate, and daily_rate are required"}), 400

    site = Site(
        name=data["name"],
        address=data.get("address"),
        total_spaces=data["total_spaces"],
        hourly_rate=data["hourly_rate"],
        daily_rate=data["daily_rate"]
    )
    db.session.add(site)
    db.session.commit()

    return jsonify({
        "id": site.id,
        "name": site.name,
        "address": site.address,
        "total_spaces": site.total_spaces,
        "hourly_rate": float(site.hourly_rate),
        "daily_rate": float(site.daily_rate),
        "is_active": site.is_active
    }), 201


@admin_users_bp.route("/admin/sites/<int:site_id>", methods=["PUT"])
@requires_role("admin")
def update_site(site_id):
    site = Site.query.get(site_id)
    if not site:
        return jsonify({"error": "Site not found"}), 404

    if not site.is_active:
        return jsonify({"error": "Cannot edit a deactivated site"}), 400

    data = request.get_json()
    if not data:
        return jsonify({"error": "No update data provided"}), 400

    if "name" in data:
        site.name = data["name"]
    if "address" in data:
        site.address = data["address"]
    if "total_spaces" in data:
        site.total_spaces = data["total_spaces"]
    if "hourly_rate" in data:
        site.hourly_rate = data["hourly_rate"]
    if "daily_rate" in data:
        site.daily_rate = data["daily_rate"]

    db.session.commit()

    return jsonify({
        "id": site.id,
        "name": site.name,
        "address": site.address,
        "total_spaces": site.total_spaces,
        "hourly_rate": float(site.hourly_rate),
        "daily_rate": float(site.daily_rate),
        "is_active": site.is_active
    }), 200


@admin_users_bp.route("/admin/sites/<int:site_id>", methods=["DELETE"])
@requires_role("admin")
def deactivate_site(site_id):
    site = Site.query.get(site_id)
    if not site:
        return jsonify({"error": "Site not found"}), 404

    site.is_active = False
    db.session.commit()

    return jsonify({"id": site.id, "is_active": site.is_active}), 200