"""
FastAPI backend for Portfolio Monitoring Agent.

This wraps the existing agent logic (agents/, core/, data/) without duplicating it.
All agent code remains unchanged - this is just an API interface layer.
"""
import sys
from pathlib import Path
from typing import Optional
from datetime import datetime
import traceback
import json
import tempfile
import os

# Add backend directory and its parent to sys.path so imports work
# whether run as `uvicorn api:app` inside backend/ or `uvicorn backend.api:app` from root
backend_dir = Path(__file__).resolve().parent
parent_dir = backend_dir.parent
for directory in (str(backend_dir), str(parent_dir)):
    if directory not in sys.path:
        sys.path.insert(0, directory)

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

# Import existing agent infrastructure (UNCHANGED)
from core.portfolio import Portfolio
from agents.orchestrator import Orchestrator
from memory.store import get_memory_store
import config


# === API Models ===

class PortfolioUploadResponse(BaseModel):
    """Response after CSV upload."""
    status: str
    message: str
    holdings: Optional[list] = None
    portfolio_value: Optional[float] = None


class MonitorRequest(BaseModel):
    """Request to run monitoring cycle."""
    mandate: str = "balanced"
    days: int = 90
    drawdown_tolerance: float = -0.15


class MonitorResponse(BaseModel):
    """Response from monitoring cycle."""
    status: str
    message: Optional[str] = None
    risk_metrics: Optional[dict] = None
    alerts: Optional[list] = None
    news_analyses: Optional[dict] = None
    briefing: Optional[str] = None
    forecast: Optional[dict] = None
    trace: Optional[str] = None
    error: Optional[str] = None


# === FastAPI App ===

app = FastAPI(
    title="Portfolio Monitoring Agent API",
    description="Multi-agent system for portfolio risk analysis and monitoring",
    version="1.0.0"
)

# CORS Configuration
# Supports setting CORS_ORIGINS via environment variable (comma-separated), with sensible defaults
cors_env = os.getenv("CORS_ORIGINS", "*")
if cors_env.strip() == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in cors_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === Global State ===

# Store the current portfolio in memory (in production, use Redis or similar)
current_portfolio: Optional[Portfolio] = None
latest_results: Optional[dict] = None


# === API Endpoints ===

@app.api_route("/", methods=["GET", "HEAD"])
@app.api_route("/health", methods=["GET", "HEAD"])
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Portfolio Monitoring Agent API",
        "version": "1.0.0",
        "model": config.get_primary_model()["name"]
    }


@app.post("/api/portfolio/upload", response_model=PortfolioUploadResponse)
async def upload_portfolio(file: UploadFile = File(...)):
    """
    Upload portfolio CSV and parse holdings.
    
    CSV format: symbol,quantity[,target_weight]
    """
    global current_portfolio
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv", mode="wb") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Load using existing Portfolio class (UNCHANGED)
        current_portfolio = Portfolio.from_csv(tmp_path)
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        # Build response
        holdings_list = [
            {
                "symbol": symbol,
                "quantity": holding.quantity,
                "weight": holding.weight,
                "target_weight": holding.target_weight
            }
            for symbol, holding in current_portfolio.holdings.items()
        ]
        
        return PortfolioUploadResponse(
            status="success",
            message=f"Loaded {len(current_portfolio.holdings)} holdings",
            holdings=holdings_list,
            portfolio_value=current_portfolio.total_value
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse portfolio: {str(e)}"
        )


@app.get("/api/portfolio/risk")
async def get_risk_metrics():
    """
    Get risk metrics for current portfolio.
    Uses existing core/metrics.py logic (UNCHANGED).
    """
    global current_portfolio, latest_results
    
    if current_portfolio is None:
        raise HTTPException(
            status_code=400,
            detail="No portfolio loaded. Upload CSV first."
        )
    
    if latest_results and latest_results.get("risk_metrics"):
        return {
            "status": "success",
            "metrics": latest_results["risk_metrics"]
        }
    
    return {
        "status": "pending",
        "message": "Run full analysis first to get detailed metrics"
    }


@app.post("/api/monitor/run", response_model=MonitorResponse)
async def run_monitoring(request: MonitorRequest):
    """
    Run complete monitoring cycle using existing Orchestrator (UNCHANGED).
    
    This wraps agents/orchestrator.py without duplicating logic.
    """
    global current_portfolio, latest_results
    
    if current_portfolio is None:
        raise HTTPException(
            status_code=400,
            detail="No portfolio loaded. Upload CSV first."
        )
    
    try:
        # Set mandate-specific parameters
        if request.mandate == "conservative":
            current_portfolio.risk_free_rate = 0.06
        elif request.mandate == "balanced":
            current_portfolio.risk_free_rate = 0.06
        elif request.mandate == "aggressive":
            current_portfolio.risk_free_rate = 0.06
        
        # Run orchestrator (uses existing agents/* code UNCHANGED)
        orchestrator = Orchestrator()
        results = orchestrator.run_full_analysis(
            portfolio=current_portfolio,
            days=request.days,
            mandate=request.mandate,
            drawdown_tolerance=request.drawdown_tolerance
        )
        
        # Store results
        latest_results = results
        
        if results.get("status") == "success":
            return MonitorResponse(
                status="success",
                risk_metrics=results.get("risk_metrics"),
                alerts=results.get("alerts"),
                news_analyses=results.get("news_analyses"),
                briefing=results.get("briefing"),
                forecast=results.get("forecast"),
                trace=results.get("trace")
            )
        else:
            return MonitorResponse(
                status="error",
                error=results.get("error", "Unknown error"),
                message=results.get("message")
            )
    
    except Exception as e:
        error_trace = traceback.format_exc()
        return MonitorResponse(
            status="error",
            error=str(e),
            message="Analysis failed",
            trace=error_trace
        )


@app.get("/api/forecast")
async def get_forecast():
    """
    Get ML volatility forecast results.
    Returns Phase 5 model comparison table.
    """
    global latest_results
    
    if latest_results is None or latest_results.get("forecast") is None:
        raise HTTPException(
            status_code=400,
            detail="No forecast available. Run monitoring first."
        )
    
    return {
        "status": "success",
        "forecast": latest_results["forecast"]
    }


@app.get("/api/trace")
async def get_trace():
    """
    Get latest agent execution trace.
    Shows tool calls, reasoning, and token usage.
    """
    global latest_results
    
    if latest_results is None or latest_results.get("trace") is None:
        return {
            "status": "no_trace",
            "message": "No execution trace available. Run monitoring first.",
            "trace": ""
        }
    
    return {
        "status": "success",
        "trace": latest_results["trace"]
    }


@app.get("/api/status")
async def get_status():
    """Get current system status."""
    return {
        "portfolio_loaded": current_portfolio is not None,
        "portfolio_holdings": len(current_portfolio.holdings) if current_portfolio else 0,
        "analysis_complete": latest_results is not None,
        "model": config.get_primary_model()["name"],
        "timestamp": datetime.utcnow().isoformat()
    }


# === Main Entry Point ===

if __name__ == "__main__":
    import uvicorn
    
    # Use PORT environment variable (for Render compatibility) or default to 7860
    port = int(os.getenv("PORT", 7860))
    
    print("=" * 60)
    print("Portfolio Monitoring Agent - FastAPI Backend")
    print("=" * 60)
    print(f"Model: {config.get_primary_model()['name']}")
    print(f"Port: {port}")
    print("=" * 60)
    
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
