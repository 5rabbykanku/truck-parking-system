import pytest
from app import create_app, db
from app.config import TestConfig
from app.models import User, Site


@pytest.fixture
def app():
    app = create_app(TestConfig)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def seed_users(app):
    with app.app_context():
        site = Site(name="Test Site", total_spaces=10, hourly_rate=5, daily_rate=30)
        db.session.add(site)
        db.session.flush()

        admin = User(name="Admin", email="admin@test.com", role="admin")
        admin.set_password("AdminPass123!")

        manager = User(name="Manager", email="manager@test.com", role="manager", site_id=site.id)
        manager.set_password("ManagerPass123!")

        employee = User(name="Employee", email="employee@test.com", role="employee", site_id=site.id)
        employee.set_password("EmployeePass123!")

        db.session.add_all([admin, manager, employee])
        db.session.commit()

        return {"site_id": site.id}