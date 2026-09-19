# Security Architecture & Vulnerability Mitigation Audit

## 1. Security Overview

The **Automated Student Attendance Alert System** is engineered with a defense-in-depth architecture. Security controls are enforced at every tier of the application stack, ensuring that confidentiality, data integrity, and compliance standards are rigorously preserved.

---

## 2. Security Domains & Mitigations

### 2.1 Authentication & Credential Protection
- **Password Hashing**: Stored using industry-standard bcrypt with work-factor salting. Plaintext passwords are never stored or logged.
- **Password Complexity Policy**: Minimum 6 characters (recommended 8+), requiring alphanumeric diversity verified by `validate_password_strength`.
- **JWT Session Security**:
  - Signed using HS256 with an ephemeral/environment-controlled `SECRET_KEY`.
  - Expiration defaults to 24 hours (`ACCESS_TOKEN_EXPIRE_MINUTES = 1440`).
  - Tokens explicitly carry user identification and role claims.
  - Expired and tampered tokens are rejected with standard `401 Unauthorized` responses.
- **Brute-Force & Credential Stuffing Defense**:
  - In-memory rate limiting applied to `/api/auth/login` (maximum 5 attempts per minute per IP).
  - Failed login attempts return generic `"Invalid institutional email or password"` messages to prevent user enumeration.

### 2.2 Role-Based Access Control (RBAC) & IDOR Mitigation
- **Principle of Least Privilege**: Enforced using FastAPI dependency injection (`require_roles([...])`).
- **Insecure Direct Object Reference (IDOR) Defense**:
  - **Student Isolation**: Endpoints verifying student identities (e.g. `/api/students/{id}/dashboard`, `/api/reports/student/{id}/csv`) explicitly assert that the authenticated user's ID matches the requested resource's owner. Cross-student data viewing returns `403 Forbidden`.
  - **Faculty Scoping**: Faculty can only mark attendance or view rosters for subjects to which they are officially assigned in the database.
  - **Admin Segregation**: System-wide configuration, scheduler management, and audit log inspection are strictly reserved for `admin` accounts.

### 2.3 SQL Injection Defense
- **Parameterized Queries**: All database queries are constructed through SQLAlchemy ORM and parameterized Core expressions.
- **Zero Raw String Concatenation**: User inputs (search terms, filter strings, student IDs) are bound as parameters. Raw string interpolation (`f"SELECT ... {user_input}"`) is completely prohibited.

### 2.4 Prompt Injection & AI Data Leakage Defense
- **Context Minimization**: Before sending student situations to language models, unnecessary PII (passwords, phone numbers, addresses, employee IDs) is stripped.
- **Input Sanitization**: User-supplied text sent to conversational endpoints is audited using `sanitize_and_check_injection` to detect and strip jailbreak patterns (`"ignore previous instructions"`, `"system prompt"`, `"reveal database"`, `"act as root"`).
- **Prompt Sandboxing**: User messages are enclosed within strict markdown delimiters (`<user_message>...</user_message>`), instructing the model to treat all enclosed text purely as untrusted conversational queries.
- **Autonomous Tool Enclosure**: LLMs cannot directly execute tool calls or modify database state. The agent invokes strictly typed Python functions with pre-validated parameters.

### 2.5 Malicious CSV Upload & Formula Injection Defense
- **Spreadsheet Formula Neutralization**: When importing or exporting CSV data, any cell value prefixed with dangerous spreadsheet formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) is sanitized by prepending a single quote (`'`), neutralizing executable macros in Microsoft Excel and Google Sheets.
- **File Validation**:
  - File size restricted to 5MB.
  - MIME type and file extension strictly verified as `.csv`.
  - Row-by-row structure validation ensures student roll numbers and subject codes exist before inserting attendance records.
  - Database operations use atomic transactions: invalid files trigger complete rollback.

### 2.6 Error Handling & Information Disclosure Prevention
- **Centralized Exception Interception**:
  - Starlette HTTP exceptions, Pydantic validation errors, and SQLAlchemy database errors are intercepted by `app.core.error_handlers`.
  - Raw Python tracebacks, file paths, and database schema errors (`OperationalError`, table names) are logged internally but sanitized to clean JSON error payloads for clients.
- **Safe Audit Logging**:
  - The `AuditLog` service intercepts all administrative and security actions.
  - Passwords, JWT tokens, and API credentials are automatically redacted before persisting audit details.

### 2.7 Cross-Origin Resource Sharing (CORS) & Secret Management
- **CORS Restrictions**: Configured with strict origin whitelisting (`CORS_ORIGINS`). Wildcard (`"*"`) origins with credentials enabled are prohibited in production.
- **Zero Hardcoded Secrets**: Secrets and keys are read exclusively from environment variables with safe fallbacks for offline testing. A template `.env.example` provides documentation without committing active secrets.

---

## 3. Automated Security Verification

The automated security test suite (`backend/tests/test_security.py`) validates:
1. Unauthorized request rejection (`401`).
2. Expired and malformed JWT token handling (`401`).
3. IDOR horizontal privilege escalation defense (`403`).
4. Faculty cross-subject access prevention (`403`).
5. Password complexity validation.
6. SQL injection resistance on search and filter parameters.
7. Prompt injection attack mitigation.
8. Malicious CSV upload and formula injection sanitization.
9. Agent tool caller role authorization.
10. Credential redaction in audit logs.
11. Login endpoint rate limiting (`429`).
