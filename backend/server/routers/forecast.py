"""
ML Volatility Forecast and Execution Trace Router.
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from backend.server.state import app_state

router = APIRouter(prefix="/api", tags=["Forecast & Telemetry"])


@router.get("/forecast")
async def get_forecast():
    if app_state.latest_results is None or app_state.latest_results.get("forecast") is None:
        raise HTTPException(
            status_code=400,
            detail="No forecast available. Please run monitoring analysis first."
        )

    return {
        "status": "success",
        "forecast": app_state.latest_results["forecast"]
    }


@router.get("/trace")
async def get_trace():
    if app_state.latest_results is None or app_state.latest_results.get("trace") is None:
        return {
            "status": "no_trace",
            "message": "No execution trace available. Please run monitoring analysis first.",
            "trace": ""
        }

    return {
        "status": "success",
        "trace": app_state.latest_results["trace"]
    }
