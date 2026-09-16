# Truck Parking & Security Management System

A full-stack web application for managing truck parking operations across one or more sites - covering the entire lifecycle from vehicle entry to paid exit, plus Admin and Manager tooling for running the business day to day.

Built as a solo Agile project over a 23-day sprint plan (Aug 24 - Sep 15, 2026).

## Tech Stack

**Backend:** Python, Flask, SQLAlchemy, PostgreSQL, Flask-Migrate (Alembic), Flask-JWT-Extended, Flask-CORS, Pytest
**Frontend:** React (Vite), React Router, Bootstrap 5, Axios, Chart.js, Vitest, React Testing Library
**Tooling:** Postman (manual API testing collection included), Git/GitHub

## Architecture Overview

### Roles

Three user roles, each with a distinct dashboard and permission set:

- **Admin** - manages Sites and Managers across the whole business, cross-site overview
- **Manager** - manages Employees at their own site, site-level dashboard (occupancy, revenue, history)
- **Employee** - logs truck entries, looks up sessions, processes payment and exit, at their own site

### Core data model

- `Site` - a physical parking location (spaces, hourly/daily rates, one assigned Manager)
- `User` - Admin, Manager, or Employee (role-based), tied to a Site (except Admin)
- `Truck` / `Driver` - reusable records, matched by plate number / phone number across visits
- `ParkingSession` - one truck's visit: entry time, exit time, fee, payment method, status
- `VerificationScan` - records manual onsite verification checks (no boom gate hardware in V1)

### Truck lifecycle (Employee-facing)

1. **Entry** - Employee logs a new truck, system generates a unique 6-digit code + QR code
2. **Lookup** - retrieve a session by code (or QR, which just encodes the same code), see live fee estimate
3. **Payment** - confirm payment method; fee is calculated automatically, never manually entered
4. **Exit** - mark the session complete; blocked until payment is confirmed

### Fee calculation

Hourly billing, rounded up to the next full hour, 1-hour minimum. Each 24-hour period (including the final partial day) is charged at whichever is cheaper: the hourly rate for that period, or the site's flat daily rate.

### Authentication

JWT-based. Tokens carry role and site_id claims, checked by a requires_role decorator on every protected route. No public signup - Admins create Managers, Managers create Employees.

## Project Structure

Backend folders: app (models, auth, entry, dashboard, admin_users, manager_users, decorators, config), migrations, tests, seed.py

Frontend folders: src/pages (one file per screen), src/components/dashboard (shared StatusBadge and tables), src/context/AuthContext.jsx, src/App.jsx (routes). Vitest test files sit alongside each page/component.

Also present: postman/ (exported Postman collection), README.md

## Setup Instructions

### Prerequisites

- Python 3.12+ and a virtual environment tool
- Node.js (LTS) and npm
- PostgreSQL running locally

### Backend

Run these commands from the backend folder:

cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

Create a .env file in backend/ with these four lines:

DATABASE_URL=postgresql://<user>:<password>@localhost:5432/truck_parking_db
SECRET_KEY=<any-random-string>
JWT_SECRET_KEY=<any-random-string>
TEST_DATABASE_URL=postgresql://<user>:<password>@localhost:5432/truck_parking_test_db

Create both databases in Postgres, then run migrations and seed data:

flask db upgrade
python seed.py

Start the server:

python -c "from app import create_app; app = create_app(); app.run(host='127.0.0.1', port=5000, debug=False)"

Note: on this development machine, Flask's debug=True reloader intermittently failed to bind the port. Running with debug=False was the reliable option; if debug mode works fine in your environment, feel free to use it.

### Frontend

cd frontend
npm install
npm run dev

The app runs at http://localhost:5173, and expects the backend at http://127.0.0.1:5000.

### Running Tests

Backend:

cd backend
pytest tests\ -v

Frontend:

cd frontend
npm test

### Test Credentials (after running seed.py)

Admin: admin@example.com / AdminPass123!
Manager: manager@example.com / ManagerPass123!
Employee: employee@example.com / EmployeePass123!

## Manual API Testing

A Postman collection is included at postman/Truck Parking System.postman_collection.json, covering auth, entry, fee, payment, and exit endpoints with auto-saving token variables.

## Known Limitations (V1)

See V2-NOTES.md for planned improvements, including hardware integration, deployment hardening, and scaling considerations not addressed in this version.