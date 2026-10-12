# FRAMEVERSE Creative Event Website

## What I checked
The uploaded project has a React + Vite frontend and a Flask + SQLite backend. The main registration endpoint and admin endpoints are present, but the included `.env` had a placeholder admin password hash, and the bundled `node_modules` did not build in this environment because its native Vite/Rolldown dependency was missing. A clean dependency install is required.

This package excludes old dependency folders, generated build files, and bundled database files. A fresh SQLite database is created automatically.

## Run locally (Windows)

### 1. Backend
Open Command Prompt in the `backend` folder:

```bat
py -m venv .venv
.venv\Scripts\activate
py -m pip install -r requirements.txt
copy .env.example .env
py -c "import secrets; print(secrets.token_hex(32))"
```

Copy the generated value into `FRAMEVERSE_SECRET_KEY` in `backend\.env`.

Generate the admin password hash (replace `YOUR_PASSWORD` with a password you choose):

```bat
py -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('YOUR_PASSWORD'))"
```

Copy the printed hash into `FRAMEVERSE_ADMIN_PASSWORD_HASH` in `backend\.env`. Set `FRAMEVERSE_ADMIN_USER` to your preferred admin username. Save `.env`.

Start the backend:

```bat
py app.py
```

Leave this terminal open. It runs at `http://127.0.0.1:5000`.

### 2. Frontend
Open a second Command Prompt in the `frontend` folder:

```bat
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`). The Vite config proxies `/api` requests to Flask on port 5000.

### 3. Admin
Open `http://localhost:5173/admin` and sign in with the username and password you configured in step 1.

### 4. Check the backend
Open `http://127.0.0.1:5000/api/health`. It should return JSON showing `"status":"ok"` and `"database":"connected"`.

## Important notes
- This is configured for local development, not public hosting. For deployment, use a production WSGI server, HTTPS, secure environment variables, and persistent database storage.
- Keep `backend/.env` private; do not upload it to GitHub.
- The frontend's `npm run api` script starts a separate Node API, but the supplied Vite proxy targets Flask. For this setup, run Flask plus Vite as described above; do not use `npm run api`.
- The form currently accepts 2–3 team members and requires the team lead to be listed as a member.

## Online deployment
See `DEPLOY_RENDER.md` for a Render deployment configuration with Gunicorn and a persistent disk. Persistent disks are paid; verify current pricing before deployment.
