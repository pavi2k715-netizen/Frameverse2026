# FRAMEVERSE: local test and online deployment

## Local test (Windows)

### Backend terminal
```bat
cd backend
py -m venv .venv
.venv\Scripts\activate
py -m pip install -r requirements.txt
copy .env.example .env
py -c "import secrets; print(secrets.token_hex(32))"
```
Paste the generated value as `FRAMEVERSE_SECRET_KEY` in `backend\.env`.

Generate an admin password hash (replace `Choose-A-Strong-Password` with the password you want):
```bat
py -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('Choose-A-Strong-Password'))"
```
Paste the hash as `FRAMEVERSE_ADMIN_PASSWORD_HASH`. Set `FRAMEVERSE_ADMIN_USER` to your chosen username. Keep `.env` private.

Start the API:
```bat
py app.py
```
Check `http://127.0.0.1:5000/api/health`; expect `{"database":"connected","status":"ok"}`.

### Frontend terminal
Open a second terminal:
```bat
cd frontend
npm ci
npm run dev
```
Open the URL printed by Vite (usually `http://localhost:5173`). Test a valid registration, verify the success screen shows an ID, then visit `/admin` and confirm that the record appears after login.

## Deploy online on Render with persistent SQLite storage

**Persistent disks require a paid Render web service.** The included `render.yaml` uses the included multi-stage Dockerfile, requests a Starter service, and mounts a 1 GB persistent disk at `/var/data`; confirm current pricing before creating the service.

1. Create a private GitHub repository and push this project. Do not commit `backend/.env`, `backend/frameverse.db`, `.venv`, `node_modules`, or secrets.
2. In Render, choose **New + → Blueprint**, connect the repository, and let Render read `render.yaml`. Render will build the React frontend and package it with Flask using Docker.
3. When prompted for environment values, set `FRAMEVERSE_ADMIN_USER` and `FRAMEVERSE_ADMIN_PASSWORD_HASH`. Generate the hash locally with the command above; enter the hash, not the plain password.
4. Deploy and wait for the health check to pass. Visit your Render URL and test `/api/health`, registration, and `/admin`.
5. Test persistence by creating a test registration, triggering a redeploy, and confirming the record remains. Never use real student information for initial tests.

The `render.yaml` generates `FRAMEVERSE_SECRET_KEY`, uses secure session cookies, runs Gunicorn, and stores SQLite at `/var/data/frameverse.db` on the persistent disk. Do not use a free ephemeral instance for this SQLite setup; its local database can be lost on restart/redeploy. For larger or multi-instance use, switch to managed PostgreSQL.

## Before announcing the site
- Test registration validation (required fields, two or three unique members, team lead listed as a member, mobile number, academic year).
- Confirm the admin cannot see registrations before login and can see them after login.
- Confirm database records survive a redeploy.
- Share only the public website URL; never share admin credentials.
