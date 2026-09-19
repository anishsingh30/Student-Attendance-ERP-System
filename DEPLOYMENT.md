# Deployment, Containerization & Operations Guide

## 1. Prerequisites

- **Python**: 3.11 or 3.12
- **Node.js**: 18.x or 20.x
- **Docker & Docker Compose**: (for containerized deployment)

---

## 2. Local Development Setup

### 2.1 Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python seed.py
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/health`

### 2.2 Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
- Portal URL: `http://127.0.0.1:5173`

### 2.3 Gradio Demo Setup (Optional)
```bash
cd gradio
pip install -r requirements.txt
python app.py
```
- Gradio Demo URL: `http://127.0.0.1:7860`

---

## 3. Docker Containerized Deployment

The repository includes complete multi-service orchestration via `docker-compose.yml`:
- `frontend`: Nginx serving production Vite bundle (`http://localhost:3000` or `5173`)
- `backend`: FastAPI Uvicorn ASGI server (`http://localhost:8000`)
- `database`: PostgreSQL 15 (`localhost:5432`)
- `gradio`: Dedicated AI/Agent demonstration container (`http://localhost:7860`)

### 3.1 Launching with Docker Compose
```bash
# Copy template and customize production values
cp .env.example .env

# Build and start all services in detached mode
docker compose up --build -d

# Verify service health
docker compose ps
```

### 3.2 Running Migrations in Docker
```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python seed.py
```

---

## 4. Production Database Migrations (Alembic)

Database schema evolution is managed via Alembic:
```bash
cd backend

# Apply pending migrations to current head
alembic upgrade head

# Generate a new migration after editing SQLAlchemy models
alembic revision --autogenerate -m "Add new column or table"

# Check migration history
alembic history --verbose
```

---

## 5. Backup & Disaster Recovery Procedures

### 5.1 SQLite (Local / Embedded Deployments)
The database file is `backend/attendance.db`. Use SQLite's online backup API or copy with locking:
```bash
# Create safe hot backup
sqlite3 backend/attendance.db ".backup 'backend/backups/attendance_backup_$(date +%Y%m%d_%H%M%S).db'"
```

### 5.2 PostgreSQL (Production Deployments)
```bash
# Automated database dump
pg_dump -h localhost -U postgres -d attendance_ai -F c -b -v -f "/var/backups/attendance_$(date +%Y%m%d_%H%M%S).dump"

# Database restore
pg_restore -h localhost -U postgres -d attendance_ai -v "/var/backups/attendance_backup.dump"
```

---

## 6. Pre-Configured Demo Accounts

| Role | Email | Password | Persona & Academic State |
|---|---|---|---|
| **Student** (Critical) | `rahul.verma@college.edu` | `student123` | CS 5th Sem, 68% Attendance, Shortage in CS501 |
| **Student** (Borderline) | `sneha.patel@college.edu` | `student123` | CS 5th Sem, 74% Attendance, Approaching 75% threshold |
| **Student** (Safe) | `priya.sharma@college.edu` | `student123` | CS 5th Sem, 92% Attendance, Exemplary compliance |
| **Faculty** | `faculty.rajesh@college.edu` | `faculty123` | CS Department Head, Networks (CS501) & SE (CS505) |
| **Admin** | `admin@college.edu` | `admin123` | University Registrar & System Administrator |

---

## 7. Vercel Production Deployment Guide

### 7.1 Deployment Architecture (Unified Monorepo)

The repository is hardened for **Unified Production Deployment on Vercel**:
- **Frontend**: Built via `cd frontend && npm install && npm run build`, outputting static assets to `frontend/dist`.
- **Backend API**: Hosted as a Serverless Python Function via `api/index.py`, which exposes the FastAPI ASGI instance.
- **Routing & Proxies**: `vercel.json` rewrites all `/api/(.*)` requests directly to `api/index.py`. Client-side SPA routes fallback to `index.html`.
- **Background Scans**: Managed serverlessly through **Vercel Cron Jobs** targeting `/api/scheduler/cron-trigger` secured via `CRON_SECRET`.

### 7.2 Production Database Requirement

> [!IMPORTANT]
> **`PRODUCTION_DATABASE_REQUIRED: YES`**
>
> Vercel functions execute in stateless, ephemeral serverless runtimes with read-only root filesystems.
> **Never use a local SQLite database (`attendance.db`) on Vercel**, as state will be lost between invocations and SQLite cannot handle concurrent serverless connections.
>
> **Recommended Production Databases:**
> - **Neon Postgres** (Serverless PostgreSQL with connection pooling)
> - **Supabase** (PostgreSQL with transaction pooler)
> - **AWS RDS / ElephantSQL / Render PostgreSQL**
>
> The codebase automatically normalizes `postgres://` URLs (common with Neon/Supabase/Heroku) to `postgresql://` for SQLAlchemy 2.0 compatibility, and configures connection pre-pinging (`pool_pre_ping=True`) and pool recycling (`pool_recycle=300`) for serverless resilience.

### 7.3 Step-by-Step Vercel Deployment Instructions

1. **Provision a PostgreSQL Database**:
   - Create a free or production database on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
   - Obtain your pooled connection string: `postgresql://user:password@host/dbname?sslmode=require`.

2. **Initialize Schema & Seed Data**:
   From your local environment with the production database URL:
   ```bash
   cd backend
   # Set the remote database URL
   export DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
   # Run Alembic migrations to current head
   alembic upgrade head
   # (Optional) Seed demo university data
   python seed.py
   ```

3. **Import Project to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard) -> **Add New...** -> **Project**.
   - Select your GitHub repository: `https://github.com/anishsingh30/Student-Attendance-ERP-System.git`.
   - **Framework Preset**: Vite (or Other; `vercel.json` automatically configures commands).
   - **Root Directory**: Leave as `./` (Root).

4. **Configure Production Environment Variables**:
   In the Vercel Project Settings -> **Environment Variables**, add:

   | Variable | Value Description | Example / Note |
   |---|---|---|
   | `ENVIRONMENT` | Environment tier | `production` |
   | `SECRET_KEY` | High-entropy hex secret (>= 32 chars) | Generate with `openssl rand -hex 32` |
   | `DATABASE_URL` | PostgreSQL connection URI | `postgresql://user:password@host/dbname?sslmode=require` |
   | `CORS_ORIGINS` | JSON array of authorized origins | `["https://your-domain.vercel.app"]` |
   | `CRON_SECRET` | Secret token for Vercel Cron authentication | Random 32+ character string |
   | `LLM_PROVIDER` | Active LLM backend | `gemini` (or `deterministic` for zero-cost offline) |
   | `GEMINI_API_KEY` | Google AI Studio API key | Required if `LLM_PROVIDER=gemini` |
   | `GEMINI_MODEL` | Preferred Gemini model | `gemini-2.5-flash` |
   | `SECURITY_HEADERS_ENABLED` | Strict CSP & HSTS enforcement | `True` |
   | `SMTP_HOST` | (Optional) Outbound email relay | e.g. `smtp.sendgrid.net` |
   | `SMTP_PORT` | (Optional) Email port | `587` |
   | `SMTP_USER` | (Optional) SMTP username | `apikey` |
   | `SMTP_PASSWORD` | (Optional) SMTP password | App secret |
   | `SMTP_FROM_EMAIL` | (Optional) Outbound sender | `alerts@college.edu` |

5. **Deploy**:
   - Click **Deploy**. Vercel will install dependencies from `requirements.txt` and `frontend/package.json`, compile the Vite bundle, and deploy the serverless Python ASGI function.

### 7.4 Vercel Cron Scheduling

The autonomous attendance scan daemon runs periodically via Vercel Crons configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/scheduler/cron-trigger",
      "schedule": "0 1 * * *"
    }
  ]
}
```
- **Frequency**: Every day at 01:00 UTC (customizable).
- **Authentication**: Vercel automatically passes `Authorization: Bearer <CRON_SECRET>`. The endpoint validates this header before triggering the agentic analysis cycle.
- **Manual Trigger**: University administrators can also trigger runs immediately from the Admin Portal.

### 7.5 Production File Storage Architecture

- **Avatars / Attachments**: On Vercel, the local filesystem `/var/task` is strictly read-only. The application routes ephemeral files to `/tmp/uploads`.
- **Permanent Enterprise Storage**: For long-term user profile photo persistence in production, integrate an S3-compatible cloud object store (AWS S3, Cloudflare R2, or Supabase Storage).

### 7.6 Health & Observability Endpoints

- `GET /health`: Lightweight liveness probe returning HTTP 200 `{"status": "alive"}`.
- `GET /ready`: Deep readiness probe inspecting PostgreSQL connectivity, Scikit-Learn ML pipeline status, LLM engine status, and notification subsystem without leaking secrets.
