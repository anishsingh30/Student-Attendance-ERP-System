import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_liveness_and_readiness_health_probes():
    """Verify that /health and /ready return appropriate dependency health information."""
    # 1. Liveness check
    res_liveness = client.get("/health")
    assert res_liveness.status_code == 200
    live_data = res_liveness.json()
    assert live_data["status"] == "alive"
    assert "version" in live_data

    # 2. Deep readiness check
    res_ready = client.get("/ready")
    assert res_ready.status_code == 200
    ready_data = res_ready.json()
    assert ready_data["status"] == "ready"
    assert "dependencies" in ready_data
    deps = ready_data["dependencies"]
    assert deps["database"]["status"] == "healthy"
    assert deps["scheduler"]["status"] in ["running", "stopped"]
    assert "ml_pipeline" in deps
    assert "ai_engine" in deps
    assert "notifications" in deps
