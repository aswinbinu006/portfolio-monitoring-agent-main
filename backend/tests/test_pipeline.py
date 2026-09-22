"""
Multi-Agent Portfolio Monitoring Pipeline Test Suite.
Validates:
1. Public routes (/health, /api/market/status)
2. JWT Authentication (signup, login, unauthorized rejection)
3. SQLite persistence of portfolio and agent memory
4. 7-Agent LangGraph orchestration and history retrieval
"""
import os
import sys
import uuid

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from starlette.testclient import TestClient
from backend.api import app
from backend.core.portfolio import Portfolio
from backend.agents.orchestrator import Orchestrator

client = TestClient(app)


def test_public_routes_accessible_without_auth():
    """Verify public health and market routes do not require JWT."""
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "ok"

    res_market = client.get("/api/market/status")
    assert res_market.status_code == 200
    assert "is_open" in res_market.json()


def test_protected_routes_reject_unauthenticated():
    """Verify protected endpoints return HTTP 401 without Bearer token."""
    res_upload = client.post("/api/portfolio/upload")
    assert res_upload.status_code == 401

    res_monitor = client.post("/api/monitor/run", json={"mandate": "balanced", "days": 30, "drawdown_tolerance": -0.15})
    assert res_monitor.status_code == 401

    res_history = client.get("/api/history")
    assert res_history.status_code == 401


def test_auth_signup_and_login_flow():
    """Verify user registration, JWT generation, and login credential verification."""
    unique_email = f"agent_eval_{uuid.uuid4().hex[:6]}@example.com"
    password = "academic_secure_password"

    # 1. Signup
    signup_res = client.post("/api/auth/signup", json={"email": unique_email, "password": password})
    assert signup_res.status_code == 200
    data = signup_res.json()
    assert "token" in data
    assert data["user"]["email"] == unique_email
    token = data["token"]

    # 2. Login with valid credentials
    login_res = client.post("/api/auth/login", json={"email": unique_email, "password": password})
    assert login_res.status_code == 200
    assert "token" in login_res.json()

    # 3. Login with invalid credentials
    bad_login = client.post("/api/auth/login", json={"email": unique_email, "password": "wrongpassword"})
    assert bad_login.status_code == 401

    # 4. Access /api/auth/me with Bearer token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["user"]["email"] == unique_email

    return token


def test_authenticated_portfolio_upload_and_pipeline_run():
    """Verify authenticated user can upload CSV and execute LangGraph pipeline with SQLite storage."""
    token = test_auth_signup_and_login_flow()
    auth_header = {"Authorization": f"Bearer {token}"}

    # Upload CSV to SQLite
    csv_bytes = b"symbol,quantity,target_weight\nRELIANCE.NS,100,0.50\nTCS.NS,50,0.50\n"
    upload_res = client.post(
        "/api/portfolio/upload",
        files={"file": ("test_portfolio.csv", csv_bytes, "text/csv")},
        headers=auth_header
    )
    assert upload_res.status_code == 200
    assert upload_res.json()["total_holdings"] == 2

    # Check holdings loaded from SQLite
    holdings_res = client.get("/api/portfolio/holdings", headers=auth_header)
    assert holdings_res.status_code == 200
    assert len(holdings_res.json()) == 2

    # Run monitoring cycle
    run_res = client.post(
        "/api/monitor/run",
        json={"mandate": "balanced", "days": 30, "drawdown_tolerance": -0.15},
        headers=auth_header
    )
    assert run_res.status_code == 200
    run_data = run_res.json()
    assert run_data["status"] == "success"
    assert "briefing" in run_data

    # Check history endpoint retrieves the run from SQLite
    history_res = client.get("/api/history", headers=auth_header)
    assert history_res.status_code == 200
    history_items = history_res.json()
    assert len(history_items) >= 1
    assert "briefing_snippet" in history_items[0]

    # Check history detail endpoint
    run_id = history_items[0]["id"]
    detail_res = client.get(f"/api/history/{run_id}", headers=auth_header)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert "portfolio_snapshot" in detail
    assert "orchestrator_engine" in detail


if __name__ == "__main__":
    print("Running test_public_routes_accessible_without_auth...")
    test_public_routes_accessible_without_auth()
    print("Running test_protected_routes_reject_unauthenticated...")
    test_protected_routes_reject_unauthenticated()
    print("Running test_auth_signup_and_login_flow...")
    test_auth_signup_and_login_flow()
    print("Running test_authenticated_portfolio_upload_and_pipeline_run...")
    test_authenticated_portfolio_upload_and_pipeline_run()
    print("\nALL 4 MULTI-AGENT PIPELINE & AUTH TESTS PASSED SUCCESSFULLY! (100% Green)")
