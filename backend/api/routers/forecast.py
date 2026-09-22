"""
ML Volatility Forecast and Execution Trace Router.
Retrieves forecast projections and LangGraph execution traces from SQLite agent memory.
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from backend.api.dependencies import get_current_user
from backend.data.db import get_latest_agent_run

router = APIRouter(prefix="/api", tags=["Forecast & Telemetry"])


@router.get("/forecast")
async def get_forecast(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve forward volatility forecast from authenticated user's latest agent run."""
    latest_run = get_latest_agent_run(current_user["id"])
    if not latest_run or not latest_run.get("forecast"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No forecast available. Please run monitoring analysis first."
        )

    return {
        "status": "success",
        "forecast": latest_run["forecast"]
    }


@router.get("/trace")
async def get_trace(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve the multi-agent execution telemetry trace from user's latest run."""
    latest_run = get_latest_agent_run(current_user["id"])
    if not latest_run or not latest_run.get("trace"):
        return {
            "status": "no_trace",
            "message": "No execution trace available. Please run monitoring analysis first.",
            "trace": ""
        }

    return {
        "status": "success",
        "trace": latest_run["trace"]
    }
