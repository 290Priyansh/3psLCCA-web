from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_validate_returns_structured_errors(global_project: dict) -> None:
    global_project["financial_data"] = {}

    response = client.post(
        "/api/lcca/validate",
        json={"project": global_project, "analysis_period_years": 50},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] == "error"
    assert payload["results"] == {}
    assert "financial_data.discount_rate is required." in payload["validation"]["errors"]


def test_calculate_returns_core_results(global_project: dict) -> None:
    response = client.post(
        "/api/lcca/calculate",
        json={"project": global_project, "analysis_period_years": 50},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] == "success"
    assert payload["results"]
    assert payload["validation"]["errors"] == []
