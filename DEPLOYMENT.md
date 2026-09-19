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
| **Student** (Critical) | `rahul.verma@college.edu` | `password123` | CS 5th Sem, 61.3% Attendance, Shortage in CS501 & CS502 |
| **Student** (Borderline) | `priya.sharma@college.edu` | `password123` | CS 5th Sem, 74.2% Attendance, Approaching 75% threshold |
| **Student** (Safe) | `amit.kumar@college.edu` | `password123` | CS 5th Sem, 89.1% Attendance, Exemplary compliance |
| **Faculty** | `faculty.cs@college.edu` | `password123` | CS Department Professor, Computer Networks & OS |
| **Admin** | `admin@college.edu` | `password123` | University Registrar & System Administrator |
