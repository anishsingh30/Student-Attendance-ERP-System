import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_public_landing_stats_endpoint():
    """
    Verifies that GET /api/public/landing-stats returns non-sensitive institutional
    metrics, threshold definitions, and status without exposing sensitive user PII.
    """
    response = client.get("/api/public/landing-stats")
    assert response.status_code == 200
    data = response.json()

    assert data["institution_name"] == "Apex Institute of Technology"
    assert data["system_name"] == "AttendanceAI"
    assert data["status"] == "operational"

    # Verify metrics structure
    assert "metrics" in data
    metrics = data["metrics"]
    assert "total_students" in metrics
    assert "total_faculty" in metrics
    assert "total_courses" in metrics
    assert "total_attendance_records" in metrics
    assert isinstance(metrics["total_students"], int)
    assert isinstance(metrics["total_faculty"], int)

    # Verify thresholds structure
    assert "thresholds" in data
    thresholds = data["thresholds"]
    assert "statutory_minimum" in thresholds
    assert "warning_threshold" in thresholds
    assert "critical_threshold" in thresholds
    assert thresholds["statutory_minimum"] >= 0

    # Ensure no PII or secrets leaked
    assert "password" not in data
    assert "secret" not in data
    assert "token" not in data
    assert "students_list" not in data
