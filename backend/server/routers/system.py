"""
System and Health Check Router.
"""
from datetime import datetime
from fastapi import APIRouter
import config
from backend.server.state import app_state

router = APIRouter(tags=["System"])


@router.api_route("/", methods=["GET", "HEAD"])
@router.api_route("/health", methods=["GET", "HEAD"])
async def root():
    return {
        "status": "ok",
        "service": "Investment Portfolio Monitoring Agent API",
        "version": "2.0.0",
        "environment": "production",
        "model": config.get_primary_model()["name"],
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/api/status")
async def get_system_status():
    has_portfolio = app_state.current_portfolio is not None
    holdings_count = len(app_state.current_portfolio.holdings) if has_portfolio else 0
    analysis_done = app_state.latest_results is not None

    return {
        "portfolio_loaded": has_portfolio,
        "portfolio_holdings": holdings_count,
        "analysis_complete": analysis_done,
        "model": config.get_primary_model()["name"],
        "timestamp": datetime.utcnow().isoformat()
    }
