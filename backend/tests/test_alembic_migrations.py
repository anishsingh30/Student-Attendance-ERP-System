import os
import subprocess
import pytest
from sqlalchemy import create_engine, inspect

def test_fresh_database_initialization_via_alembic():
    """Verify that an empty database can be completely initialized using alembic upgrade head without create_all."""
    test_db_path = "test_alembic_fresh.db"
    if os.path.exists(test_db_path):
        os.remove(test_db_path)

    test_db_url = f"sqlite:///./{test_db_path}"
    env = os.environ.copy()
    env["DATABASE_URL"] = test_db_url

    try:
        # Run alembic upgrade head
        result = subprocess.run(
            [os.path.join(os.path.dirname(__file__), "..", "venv", "Scripts", "alembic.exe"), "upgrade", "head"],
            cwd=os.path.join(os.path.dirname(__file__), ".."),
            env=env,
            capture_output=True,
            text=True
        )
        assert result.returncode == 0, f"Alembic upgrade failed: {result.stderr}\n{result.stdout}"

        # Inspect generated database schema
        engine = create_engine(test_db_url)
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())

        required_tables = {
            "users",
            "students",
            "faculty",
            "subjects",
            "faculty_subjects",
            "attendance",
            "attendance_corrections",
            "attendance_thresholds",
            "alerts",
            "notifications",
            "agent_runs",
            "agent_logs",
            "audit_logs",
            "system_settings"
        }

        missing_tables = required_tables - tables
        assert len(missing_tables) == 0, f"Missing tables after Alembic upgrade: {missing_tables}"

    finally:
        if os.path.exists(test_db_path):
            try:
                os.remove(test_db_path)
            except Exception:
                pass
