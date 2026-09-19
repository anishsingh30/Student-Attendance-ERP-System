import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.agents.llm_provider import llm_provider

client = TestClient(app)

def test_ai_status_endpoint():
    resp = client.get("/api/ai/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "is_live" in data
    assert "provider" in data
    assert "display_badge" in data
    # Badge should never contain mock/demo in production-style wording
    assert "MOCK" not in data["display_badge"]
    assert data["display_badge"] in ["LIVE LLM", "OFFLINE REASONING", "CONFIGURATION REQUIRED"]

def test_ai_health_endpoint():
    resp = client.get("/api/ai/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "mode" in data

def test_deterministic_offline_reasoning_explanation():
    # Verify that mathematical precision is preserved in generated explanations
    explanation = llm_provider.generate_personalized_alert_explanation(
        student_name="Rahul Verma",
        subject_name="Computer Networks",
        current_pct=68.0,
        required_pct=75.0,
        attended=34,
        conducted=50,
        classes_needed=7,
        risk_level="ORANGE"
    )
    assert "Computer Networks" in explanation["title"]
    assert "68.0%" in explanation["explanation"]
    assert "7" in explanation["recommended_action"]
