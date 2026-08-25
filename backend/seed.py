from werkzeug.security import generate_password_hash
from app import create_app, db
from app.models import User, Site

app = create_app()

with app.app_context():
    existing_site = Site.query.filter_by(name="Main Depot").first()

    if existing_site:
                print("Seed data already exists - skipping. Delete rows manually if you want to reseed.")
    else:
        site = Site(
            name="Main Depot",
            address="1 Industrial Way",
            total_spaces=50,
            hourly_rate=10.00,
            daily_rate=50.00,
        )
        db.session.add(site)
        db.session.flush()  # gives site.id without a full commit yet

        admin = User(
            name="Alex Admin",
            email="admin@example.com",
            password_hash=generate_password_hash("AdminPass123!"),
            role="admin",
            site_id=None,
        )

        manager = User(
            name="Morgan Manager",
            email="manager@example.com",
            password_hash=generate_password_hash("ManagerPass123!"),
            role="manager",
            site_id=site.id,
        )

        db.session.add_all([admin, manager])
        db.session.flush()  # gives manager.id

        site.manager_id = manager.id

        employee = User(
            name="Ellis Employee",
            email="employee@example.com",
            password_hash=generate_password_hash("EmployeePass123!"),
            role="employee",
            site_id=site.id,
        )
        db.session.add(employee)

        db.session.commit()
        print("Seed data created: 1 site, 1 admin, 1 manager, 1 employee.")