# FastAPI REST API Specification

The API gateway is hosted at `/api` (OpenAPI Swagger docs at `/docs` and ReDoc at `/redoc`). All authenticated requests must include the header `Authorization: Bearer <access_token>`.

---

## 1. Authentication & Account Management (`/api/auth`)

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates student, faculty, or admin. Returns JWT token and role. |
| `POST` | `/api/auth/register` | Public | Self-registration for students and faculty accounts. |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user profile and academic metadata. |

---

## 2. Student Portal Endpoints (`/api/students`)

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/students/me/dashboard` | Student | Returns comprehensive term overview, overall %, and subjects. |
| `GET` | `/api/students/me/attendance` | Student | Returns session-level attendance history (filterable by subject and status). |
| `GET` | `/api/students/{id}/dashboard` | Faculty / Admin | Institutional access to a specific student's attendance dashboard. |

---

## 3. Faculty Portal Endpoints (`/api/faculty`)

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/faculty/dashboard` | Faculty / Admin | Returns faculty overview, assigned subjects, and term statistics. |
| `GET` | `/api/faculty/subjects` | Faculty / Admin | Returns subjects assigned to the calling faculty member. |
| `GET` | `/api/faculty/students` | Faculty / Admin | Returns enrolled students roster for assigned subjects with risk tiers. |

---

## 4. Attendance & Simulation Endpoints (`/api/attendance`)

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/attendance/` | Authenticated | Retrieves attendance records filtered by subject or student ID. |
| `POST` | `/api/attendance/` | Faculty / Admin | Records an individual attendance entry for a student session. |
| `PUT` | `/api/attendance/{id}` | Faculty / Admin | Corrects an existing attendance record (generates an audit trail). |
| `POST` | `/api/attendance/import` | Faculty / Admin | Validates and imports attendance records via CSV upload. |
| `POST` | `/api/attendance/what-if` | Authenticated | Deterministic What-If simulation with consecutive recovery calculation. |

---

## 5. Machine Learning Risk & Trajectory Engine (`/api/ml`)

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/ml/metrics` | Authenticated | Returns authentic evaluation metrics (Accuracy, F1, Confusion Matrix). |
| `POST` | `/api/ml/predict/{student_id}` | Authenticated | Runs live ML inference to forecast debarment risk trajectory. |
| `POST` | `/api/ml/train` | Admin | Retrains the Random Forest classifier on latest database records. |

---

## 6. Autonomous Agent & Scheduler (`/api/agent` & `/api/scheduler`)

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/agent/analyze` | Admin | Triggers a 10-stage autonomous attendance monitoring cycle. |
| `GET` | `/api/agent/runs` | Admin | Returns list of historical agent monitoring execution records. |
| `GET` | `/api/agent/runs/{id}/logs` | Admin | Returns stage-by-stage tool execution logs for an agent run. |
| `GET` | `/api/scheduler/status` | Admin | Retrieves current background scheduler daemon status and next run. |
| `POST` | `/api/scheduler/config` | Admin | Enables/disables scheduler and updates periodic interval (hours). |
| `POST` | `/api/scheduler/trigger` | Admin | Manually triggers an immediate background monitoring cycle. |

---

## 7. Institutional Reports & Streaming CSV Exports (`/api/reports`)

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/reports/at-risk` | Faculty / Admin | JSON roster of students below statutory attendance thresholds. |
| `GET` | `/api/reports/at-risk/csv` | Faculty / Admin | Streams downloadable CSV of the at-risk roster. |
| `GET` | `/api/reports/subjects` | Faculty / Admin | JSON summary of subject compliance, average %, and shortages. |
| `GET` | `/api/reports/subjects/csv` | Faculty / Admin | Streams downloadable CSV of subject overviews. |
| `GET` | `/api/reports/departments` | Admin | JSON breakdown of department student counts and compliance rates. |
| `GET` | `/api/reports/departments/csv` | Admin | Streams downloadable CSV of department compliance statistics. |
| `GET` | `/api/reports/agent-runs` | Admin | JSON history of autonomous agent execution cycles and metrics. |
| `GET` | `/api/reports/agent-runs/csv` | Admin | Streams downloadable CSV of agent execution logs. |
| `GET` | `/api/reports/student/{id}/csv` | Student / Admin | Streams complete historical attendance log for a specific student. |

---

## 8. Multi-Channel Notification Gateway (`/api/notifications` & `/api/alerts`)

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications/` | Authenticated | Retrieves current user's unread in-app bell notifications. |
| `GET` | `/api/notifications/all` | Admin | System-wide notification delivery log (In-App & Email). |
| `PUT` | `/api/notifications/{id}/read` | Authenticated | Marks a specific notification as read. |
| `PUT` | `/api/notifications/read-all` | Authenticated | Marks all notifications for current user as read. |
| `POST` | `/api/notifications/{id}/retry`| Admin | Retries dispatch for failed notifications. |
| `GET` | `/api/alerts/` | Authenticated | Retrieves persistent academic alerts (filterable by risk level). |
| `PUT` | `/api/alerts/{id}/resolve` | Faculty / Admin | Marks an academic risk alert as resolved. |

---

## 9. Administrative Settings & Audit (`/api/admin` & `/api/ai`)

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/analytics` | Admin | Executive summary of students, faculty, alerts, and runs. |
| `GET` | `/api/admin/users` | Admin | User directory filterable by role (`student`, `faculty`, `admin`). |
| `GET` | `/api/admin/subjects` | Admin | Complete catalog of university courses and faculty assignments. |
| `GET` | `/api/admin/thresholds` | Admin | Retrieves current institutional attendance risk thresholds. |
| `PUT` | `/api/admin/thresholds` | Admin | Updates institutional attendance risk thresholds. |
| `GET` | `/api/admin/audit-logs` | Admin | Immutable security and system audit log. |
| `GET` | `/api/ai/status` | Authenticated | Verifies active LLM provider (Gemini, OpenAI, or Fallback). |
| `POST` | `/api/ai/chat` | Authenticated | Conversational student advisor backed by factual tools. |
