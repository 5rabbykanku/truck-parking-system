from datetime import datetime, date, time
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt
from app.decorators import requires_role
from app.models import ParkingSession, Site

dashboard_bp = Blueprint("dashboard", __name__)


def get_manager_site_id():
    claims = get_jwt()
    return claims.get("site_id")


def parse_date_range():
    start_str = request.args.get("start")
    end_str = request.args.get("end")

    if start_str:
        start = datetime.combine(date.fromisoformat(start_str), time.min)
    else:
        start = datetime.combine(date.today(), time.min)

    if end_str:
        end = datetime.combine(date.fromisoformat(end_str), time.max)
    else:
        end = datetime.combine(date.today(), time.max)

    return start, end


@dashboard_bp.route("/dashboard/current", methods=["GET"])
@requires_role("manager", "employee")
def currently_parked():
    site_id = get_manager_site_id()

    sessions = ParkingSession.query.filter_by(site_id=site_id, status="active").all()

    return jsonify([{
        "session_id": s.id,
        "parking_code": s.parking_code,
        "entry_time": s.entry_time.isoformat(),
        "truck": {"plate_number": s.truck.plate_number, "truck_type": s.truck.truck_type},
        "driver": {"name": s.driver.name, "phone_number": s.driver.phone_number}
    } for s in sessions]), 200


@dashboard_bp.route("/dashboard/spaces", methods=["GET"])
@requires_role("manager")
def available_spaces():
    site_id = get_manager_site_id()
    site = Site.query.get(site_id)

    occupied = ParkingSession.query.filter_by(site_id=site_id, status="active").count()
    available = site.total_spaces - occupied

    return jsonify({
        "total_spaces": site.total_spaces,
        "occupied": occupied,
        "available": available
    }), 200


@dashboard_bp.route("/dashboard/today", methods=["GET"])
@requires_role("manager")
def today_activity():
    site_id = get_manager_site_id()
    start = datetime.combine(date.today(), time.min)
    end = datetime.combine(date.today(), time.max)

    entries_today = ParkingSession.query.filter(
        ParkingSession.site_id == site_id,
        ParkingSession.entry_time >= start,
        ParkingSession.entry_time <= end
    ).count()

    exits_today = ParkingSession.query.filter(
        ParkingSession.site_id == site_id,
        ParkingSession.exit_time >= start,
        ParkingSession.exit_time <= end
    ).count()

    return jsonify({
        "date": date.today().isoformat(),
        "entries": entries_today,
        "exits": exits_today
    }), 200


@dashboard_bp.route("/dashboard/revenue", methods=["GET"])
@requires_role("manager")
def revenue_totals():
    site_id = get_manager_site_id()
    start, end = parse_date_range()

    sessions = ParkingSession.query.filter(
        ParkingSession.site_id == site_id,
        ParkingSession.payment_confirmed_at.isnot(None),
        ParkingSession.payment_confirmed_at >= start,
        ParkingSession.payment_confirmed_at <= end
    ).all()

    total_revenue = sum(float(s.fee_amount) for s in sessions if s.fee_amount)

    return jsonify({
        "start": start.date().isoformat(),
        "end": end.date().isoformat(),
        "payment_count": len(sessions),
        "total_revenue": round(total_revenue, 2)
    }), 200


@dashboard_bp.route("/dashboard/history", methods=["GET"])
@requires_role("manager")
def parking_history():
    site_id = get_manager_site_id()
    start, end = parse_date_range()

    sessions = ParkingSession.query.filter(
        ParkingSession.site_id == site_id,
        ParkingSession.entry_time >= start,
        ParkingSession.entry_time <= end
    ).order_by(ParkingSession.entry_time.desc()).all()

    return jsonify([{
        "session_id": s.id,
        "parking_code": s.parking_code,
        "status": s.status,
        "entry_time": s.entry_time.isoformat(),
        "exit_time": s.exit_time.isoformat() if s.exit_time else None,
        "fee_amount": float(s.fee_amount) if s.fee_amount else None,
        "payment_method": s.payment_method,
        "truck": {"plate_number": s.truck.plate_number, "truck_type": s.truck.truck_type},
        "driver": {"name": s.driver.name, "phone_number": s.driver.phone_number}
    } for s in sessions]), 200


@dashboard_bp.route("/admin/sites", methods=["GET"])
@requires_role("admin")
def all_sites_summary():
    sites = Site.query.all()

    result = []
    for site in sites:
        occupied = ParkingSession.query.filter_by(site_id=site.id, status="active").count()
        start = datetime.combine(date.today(), time.min)
        end = datetime.combine(date.today(), time.max)
        today_revenue_sessions = ParkingSession.query.filter(
            ParkingSession.site_id == site.id,
            ParkingSession.payment_confirmed_at.isnot(None),
            ParkingSession.payment_confirmed_at >= start,
            ParkingSession.payment_confirmed_at <= end
        ).all()
        today_revenue = sum(float(s.fee_amount) for s in today_revenue_sessions if s.fee_amount)

        result.append({
            "site_id": site.id,
            "name": site.name,
            "total_spaces": site.total_spaces,
            "occupied": occupied,
            "available": site.total_spaces - occupied,
            "today_revenue": round(today_revenue, 2)
        })

    return jsonify(result), 200


@dashboard_bp.route("/admin/sites/<int:site_id>/current", methods=["GET"])
@requires_role("admin")
def admin_site_current(site_id):
    sessions = ParkingSession.query.filter_by(site_id=site_id, status="active").all()

    return jsonify([{
        "session_id": s.id,
        "parking_code": s.parking_code,
        "entry_time": s.entry_time.isoformat(),
        "truck": {"plate_number": s.truck.plate_number, "truck_type": s.truck.truck_type},
        "driver": {"name": s.driver.name, "phone_number": s.driver.phone_number}
    } for s in sessions]), 200


@dashboard_bp.route("/admin/sites/<int:site_id>/history", methods=["GET"])
@requires_role("admin")
def admin_site_history(site_id):
    start, end = parse_date_range()

    sessions = ParkingSession.query.filter(
        ParkingSession.site_id == site_id,
        ParkingSession.entry_time >= start,
        ParkingSession.entry_time <= end
    ).order_by(ParkingSession.entry_time.desc()).all()

    return jsonify([{
        "session_id": s.id,
        "parking_code": s.parking_code,
        "status": s.status,
        "entry_time": s.entry_time.isoformat(),
        "exit_time": s.exit_time.isoformat() if s.exit_time else None,
        "fee_amount": float(s.fee_amount) if s.fee_amount else None,
        "payment_method": s.payment_method,
        "truck": {"plate_number": s.truck.plate_number, "truck_type": s.truck.truck_type},
        "driver": {"name": s.driver.name, "phone_number": s.driver.phone_number}
    } for s in sessions]), 200