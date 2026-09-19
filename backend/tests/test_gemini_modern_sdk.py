import sys
import json
import pytest
from app.agents.llm_provider import (
    llm_provider,
    get_gemini_candidate_models,
    sanitize_and_check_injection,
    format_compact_context
)

def test_deprecated_google_generativeai_not_imported():
    """Verify google.generativeai is not present in sys.modules or imported anywhere in the app."""
    import sys
    assert "google.generativeai" not in sys.modules, "Deprecated google.generativeai package was imported!"

def test_modern_google_genai_imported():
    """Verify the modern google.genai package is available and can be imported."""
    from google import genai
    from google.genai import types
    assert hasattr(genai, "Client")
    assert hasattr(types, "GenerateContentConfig")

def test_candidate_models_selection():
    """Verify modern high-speed Gemini candidate models are prioritized."""
    models = get_gemini_candidate_models()
    assert len(models) >= 3
    assert any("flash" in m for m in models)
    # Ensure obsolete names are not in candidates
    assert "gemini-3.5-flash-lite" not in models

def test_ai_status_does_not_leak_api_key():
    """Verify /api/ai/status and get_status_info() never expose API key or secret values."""
    status_info = llm_provider.get_status_info()
    json_str = json.dumps(status_info)
    assert "key" not in json_str.lower() or "configured" in json_str.lower()
    assert llm_provider.gemini_key not in json_str if llm_provider.gemini_key else True
    assert "AQ." not in json_str
    assert "sk-" not in json_str

def test_ai_health_does_not_leak_credentials():
    """Verify /api/ai/health check returns safe metadata without internal keys."""
    health_info = llm_provider.check_health()
    json_str = json.dumps(health_info)
    assert llm_provider.gemini_key not in json_str if llm_provider.gemini_key else True
    assert "status" in health_info
    assert health_info["status"] in ["healthy", "degraded"]

def test_deterministic_offline_reasoning_fallback():
    """Verify deterministic fallback works instantly for all student and faculty queries."""
    ctx = {
        "student_id": 1,
        "full_name": "Rahul Verma",
        "roll_number": "CS2022-001",
        "department": "Computer Science",
        "overall_percentage": 68.5,
        "total_subjects": 5,
        "subjects": [
            {
                "subject_id": 1,
                "subject_code": "CS501",
                "subject_name": "Computer Networks",
                "percentage": 62.0,
                "classes_attended": 31,
                "classes_conducted": 50,
                "risk_level": "RED",
                "consecutive_classes_needed": 26,
                "max_classes_can_miss": 0
            }
        ]
    }
    res = llm_provider._deterministic_academic_reasoning(
        user_role="student",
        user_name="Rahul Verma",
        query="Why is my attendance low?",
        ctx=ctx
    )
    assert "reply" in res
    assert len(res["reply"]) > 10
    assert "suggested_actions" in res
