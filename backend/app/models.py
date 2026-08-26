from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app import db


class Role:
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"


class Site(db.Model):
    __tablename__ = "sites"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    address = db.Column(db.String(255))
    total_spaces = db.Column(db.Integer, nullable=False, default=0)
    hourly_rate = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    daily_rate = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    manager_id = db.Column(db.Integer, db.ForeignKey("users.id", use_alter=True, name="fk_sites_manager_id"), nullable=True)
    manager = db.relationship("User", foreign_keys=[manager_id], back_populates="managed_site")
    employees = db.relationship("User", foreign_keys="User.site_id", back_populates="site")
    parking_sessions = db.relationship("ParkingSession", back_populates="site")


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    site_id = db.Column(db.Integer, db.ForeignKey("sites.id"), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_active_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    site = db.relationship("Site", foreign_keys=[site_id], back_populates="employees")
    managed_site = db.relationship("Site", foreign_keys="Site.manager_id", back_populates="manager", uselist=False)
    sessions_logged = db.relationship("ParkingSession", back_populates="employee")
    verification_scans = db.relationship("VerificationScan", back_populates="employee")
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Truck(db.Model):
    __tablename__ = "trucks"

    id = db.Column(db.Integer, primary_key=True)
    plate_number = db.Column(db.String(20), nullable=False)
    truck_type = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    parking_sessions = db.relationship("ParkingSession", back_populates="truck")


class Driver(db.Model):
    __tablename__ = "drivers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    phone_number = db.Column(db.String(30))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    parking_sessions = db.relationship("ParkingSession", back_populates="driver")


class ParkingSession(db.Model):
    __tablename__ = "parking_sessions"

    id = db.Column(db.Integer, primary_key=True)
    parking_code = db.Column(db.String(10), unique=True, nullable=False)
    qr_code_data = db.Column(db.Text)
    vehicle_photo_url = db.Column(db.String(255))
    driver_photo_url = db.Column(db.String(255))

    truck_id = db.Column(db.Integer, db.ForeignKey("trucks.id"), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey("drivers.id"), nullable=False)
    site_id = db.Column(db.Integer, db.ForeignKey("sites.id"), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    entry_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    exit_time = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="active")
    fee_amount = db.Column(db.Numeric(10, 2), nullable=True)
    payment_method = db.Column(db.String(30), nullable=True)
    payment_confirmed_at = db.Column(db.DateTime, nullable=True)

    truck = db.relationship("Truck", back_populates="parking_sessions")
    driver = db.relationship("Driver", back_populates="parking_sessions")
    site = db.relationship("Site", back_populates="parking_sessions")
    employee = db.relationship("User", back_populates="sessions_logged")
    verification_scans = db.relationship("VerificationScan", back_populates="parking_session")


class VerificationScan(db.Model):
    __tablename__ = "verification_scans"

    id = db.Column(db.Integer, primary_key=True)
    parking_session_id = db.Column(db.Integer, db.ForeignKey("parking_sessions.id"), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    scanned_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    result = db.Column(db.String(20), nullable=False)
    notes = db.Column(db.Text, nullable=True)

    parking_session = db.relationship("ParkingSession", back_populates="verification_scans")
    employee = db.relationship("User", back_populates="verification_scans")