"""
Unit and Integration Tests for Production FastAPI Server and Services.
Tests portfolio uploading, health scores, diversification indices, and security headers.
"""
from io import BytesIO
from starlette.testclient import TestClient
from backend.server.main import app
from backend.server.services.portfolio_service import portfolio_service
from backend.server.state import app_state

client = TestClient(app)


def test_health_endpoint():
    """Verify health endpoint responds with 200 and security headers."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "2.0.0"
    assert "X-Content-Type-Options" in response.headers
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"


def test_market_status_endpoint():
    """Verify market status returns trading hours and gainers/losers."""
    response = client.get("/api/market/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_open" in data
    assert "market_name" in data
    assert len(data["gainers_today"]) > 0
    assert len(data["losers_today"]) > 0


def test_watchlist_crud():
    """Verify watchlist retrieval, addition, and removal."""
    # 1. Get initial watchlist
    res = client.get("/api/portfolio/watchlist")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 5

    # 2. Add new symbol
    add_res = client.post("/api/portfolio/watchlist", json={"symbol": "NVDA", "name": "NVIDIA Corporation"})
    assert add_res.status_code == 200
    assert add_res.json()["symbol"] == "NVDA"

    # 3. Delete symbol
    del_res = client.delete("/api/portfolio/watchlist/NVDA")
    assert del_res.status_code == 200


def test_portfolio_upload_csv():
    """Verify CSV upload parsing and holding response."""
    csv_content = b"symbol,quantity,target_weight\nRELIANCE.NS,100,0.60\nTCS.NS,50,0.40\n"
    response = client.post(
        "/api/portfolio/upload",
        files={"file": ("test_portfolio.csv", csv_content, "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_holdings"] == 2
    assert len(data["holdings"]) == 2
    assert data["holdings"][0]["symbol"] == "RELIANCE.NS"
    assert data["holdings"][0]["quantity"] == 100
    assert data["holdings"][0]["target_weight"] == 0.60
    assert data["holdings"][0]["sector"] != ""


def test_portfolio_upload_invalid_file():
    """Verify invalid format triggers structured HTTP 400."""
    response = client.post(
        "/api/portfolio/upload",
        files={"file": ("test.pdf", b"%PDF-1.4", "application/pdf")}
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "error" in data


def test_health_score_calculation():
    """Verify portfolio health score logic and bounds."""
    weights = {"RELIANCE.NS": 0.25, "TCS.NS": 0.25, "INFY.NS": 0.25, "HDFCBANK.NS": 0.25}
    health = portfolio_service.calculate_health_score(weights, volatility=0.14, max_drawdown=-0.09)
    assert 0 <= health.score <= 100
    assert health.grade in ("A+", "A", "B", "C", "D", "F")
    assert health.diversification_score > 0
    assert len(health.key_strengths) > 0


def test_diversification_concentration_warning():
    """Verify concentration warning when single holding exceeds 35%."""
    weights = {"RELIANCE.NS": 0.80, "TCS.NS": 0.20}
    holdings = []
    div = portfolio_service.calculate_diversification(holdings, weights)
    assert div.top_holding_concentration == 0.80
    assert any("Concentration Risk" in w for w in div.warnings)
