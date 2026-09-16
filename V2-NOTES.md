# V2 Notes - Deployment & Hardware Integration Considerations

Things intentionally out of scope for V1, worth planning for the next version.

## Hardware Integration

V1 is app-only - no boom gate, no automated plate recognition (ANPR/OCR). Manual entry + photo capture stands in for both. For V2:

- Boom gate integration would need a hardware API or a physical relay controller triggered by session status (e.g. open on payment confirmation, close after exit).
- ANPR (automatic plate recognition) would replace manual plate entry - this needs either a dedicated camera + OCR service (cloud or on-prem) or a third-party ANPR API. Manual entry stays as a fallback for misreads.
- The VerificationScan table already exists in the data model as a placeholder for this - currently used for manual onsite checks, but structured so a real scan event (barcode, ANPR, RFID) could populate it instead.

## Deployment Considerations

V1 has only been run locally (Flask dev server, Vite dev server, local Postgres). Not addressed yet:

- Production WSGI server - Flask's built-in server explicitly warns it's not for production use. Needs Gunicorn or similar behind a reverse proxy (Nginx).
- Environment configuration - secrets (SECRET_KEY, JWT_SECRET_KEY, DB credentials) are currently in a local .env file. Production needs a proper secrets manager, not a committed file.
- HTTPS - all local testing has been over plain HTTP. Needs a TLS certificate in front of any real deployment.
- CORS origin - currently hardcoded to http://localhost:5173. Needs to be the real frontend domain in production, and possibly support multiple environments (staging/prod).
- Frontend build and hosting - the frontend has only been run via npm run dev (Vite's dev server). Production needs npm run build and static hosting (e.g. Nginx, S3+CloudFront, or similar).
- Database - local Postgres instance only. Production needs a managed database (backups, connection pooling, monitoring).

## Known Environment Quirk

On the development machine used for this build, Flask's debug=True reloader intermittently failed to bind to port 5000 (the process would appear to start but never actually listen). Running with debug=False was the reliable workaround throughout the project. Worth investigating root cause if debug mode's auto-reload convenience is wanted for V2 development.

## Scaling Considerations Not Addressed in V1

- Parking codes are 6-digit random numbers checked for uniqueness against ALL sessions ever created (not just active ones). At very high volume over a long lifetime, this could eventually need code recycling from completed sessions, though it's not a near-term concern.
- No pagination on list endpoints (dashboard history, admin site lists, employee lists). Fine at current data volumes; would need pagination if a site accumulates years of session history.
- No rate limiting on any endpoint, including login.
- Photo capture (vehicle_photo_url, driver_photo_url) exists as string fields in the data model, but V1 never actually implements file upload/storage - this is a placeholder for a real V2 implementation (e.g. S3 or similar object storage).

## Testing Notes for V2

- Backend: 84 pytest tests covering auth, entry lifecycle, fee calculation, payment, exit, dashboards, and Admin/Manager CRUD.
- Frontend: 28 Vitest/RTL tests covering forms, dashboards, and CRUD screens.
- Not covered: load/performance testing, security penetration testing, cross-browser testing (only tested in one browser during development).