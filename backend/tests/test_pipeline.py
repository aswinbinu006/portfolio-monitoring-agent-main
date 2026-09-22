"""
Multi-Agent Portfolio Monitoring Pipeline Test Suite.
Validates the complete 7-agent LangGraph orchestration and REST API endpoints.
"""
from starlette.testclient import TestClient
from backend.api import app
from backend.core.portfolio import Portfolio
from backend.agents.orchestrator import Orchestrator

client = TestClient(app)


def test_api_health():
    """Verify API health endpoint responds with 200."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_portfolio_upload_endpoint():
    """Verify CSV upload parsing and holding registration."""
    csv_bytes = b"symbol,quantity,target_weight\nRELIANCE.NS,100,0.60\nTCS.NS,50,0.40\n"
    response = client.post(
        "/api/portfolio/upload",
        files={"file": ("test_portfolio.csv", csv_bytes, "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_holdings"] == 2
    assert len(data["holdings"]) == 2
    assert data["holdings"][0]["symbol"] == "RELIANCE.NS"


def test_langgraph_pipeline_execution():
    """Verify 7-agent pipeline executes end-to-end via LangGraph orchestrator."""
    portfolio = Portfolio.from_csv("backend/sample_portfolio.csv")
    assert len(portfolio.holdings) > 0

    orchestrator = Orchestrator(session_id="pipeline_eval_test")
    results = orchestrator.run_full_analysis(
        portfolio=portfolio,
        days=30,
        mandate="balanced",
        drawdown_tolerance=-0.15
    )

    assert results["status"] == "success"
    assert "orchestrator_engine" in results
    assert "risk_metrics" in results
    assert "alerts" in results
    assert "briefing" in results
