"""
System, Health, and Environment Readiness Router.
"""
from datetime import datetime
from fastapi import APIRouter
try:
    import config
except ImportError:
    from backend import config

router = APIRouter(tags=["System"])


@router.api_route("/", methods=["GET", "HEAD"])
@router.api_route("/health", methods=["GET", "HEAD"])
async def root():
    """Health check endpoint for container orchestrators and monitoring probes."""
    return {
        "status": "ok",
        "service": "Investment Portfolio Monitoring Agent API",
        "version": "2.0.0",
        "orchestrator": "LangGraph StateGraph",
        "storage": "SQLite Persistent Agent Memory",
        "model": config.get_primary_model()["name"],
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/api/status")
async def get_system_status():
    """Telemetry endpoint reporting system readiness."""
    return {
        "status": "online",
        "database": "sqlite",
        "orchestrator": "LangGraph StateGraph",
        "model": config.get_primary_model()["name"],
        "timestamp": datetime.utcnow().isoformat(),
    }
