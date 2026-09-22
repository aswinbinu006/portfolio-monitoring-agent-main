"""
Analysis, Risk, and Alerts Router.
Triggers multi-agent monitoring cycles, persists runs to SQLite, and exposes quantitative results.
"""
import time
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, status, Depends

from backend.schemas.common import (
    MonitorRequest,
    MonitorResponse,
    RiskMetricsSummary,
    AlertItem,
    PortfolioHealthScore,
    DiversificationAnalysis,
    HoldingItem,
)
from backend.api.dependencies import get_current_user, require_user_portfolio
from backend.data.db import save_agent_run, get_latest_agent_run, get_user_portfolio
from backend.services.portfolio_service import portfolio_service, get_sector_for_ticker
from backend.ml import detect_multivariate_anomalies
from backend.agents.orchestrator import Orchestrator
from backend.core.portfolio import Portfolio

router = APIRouter(prefix="/api", tags=["Analysis & Risk"])


@router.post("/monitor/run", response_model=MonitorResponse)
async def run_monitoring(
    request: MonitorRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    portfolio: Portfolio = Depends(require_user_portfolio)
):
    """
    Execute comprehensive multi-agent portfolio analysis via LangGraph,
    and persist results directly to SQLite agent memory.
    """
    start_time = time.perf_counter()

    try:
        if request.mandate == "conservative":
            portfolio.risk_free_rate = 0.065
        elif request.mandate == "balanced":
            portfolio.risk_free_rate = 0.060
        elif request.mandate == "aggressive":
            portfolio.risk_free_rate = 0.055

        orchestrator = Orchestrator()
        results = orchestrator.run_full_analysis(
            portfolio=portfolio,
            days=request.days,
            mandate=request.mandate,
            drawdown_tolerance=request.drawdown_tolerance
        )

        latest_val = None
        weights_dict = {}
        if not portfolio.prices.empty:
            try:
                latest_val = float(portfolio.get_portfolio_value())
                weights_dict = portfolio.get_weights()
            except Exception:
                pass

        if not weights_dict and portfolio.holdings:
            n = len(portfolio.holdings)
            weights_dict = {h.ticker: 1.0 / n for h in portfolio.holdings}

        risk_metrics = results.get("risk_metrics") or {}
        ann_vol = risk_metrics.get("annualized_volatility")
        sharpe = risk_metrics.get("sharpe_ratio")
        mdd = risk_metrics.get("max_drawdown")
        var_95 = risk_metrics.get("historical_var_95")

        health_score = portfolio_service.calculate_health_score(
            weights=weights_dict,
            volatility=ann_vol,
            sharpe_ratio=sharpe,
            max_drawdown=mdd
        )

        risk_meter = portfolio_service.calculate_risk_meter(
            volatility=ann_vol,
            max_drawdown=mdd,
            var_95=var_95
        )

        holdings_items = [
            HoldingItem(
                symbol=h.ticker,
                quantity=h.quantity,
                weight=weights_dict.get(h.ticker, 0.0),
                target_weight=h.target_weight,
                sector=get_sector_for_ticker(h.ticker)
            )
            for h in portfolio.holdings
        ]
        diversification = portfolio_service.calculate_diversification(
            holdings=holdings_items,
            weights=weights_dict
        )

        structured_alerts: List[AlertItem] = []
        raw_alerts = results.get("alerts") or []
        for i, a in enumerate(raw_alerts):
            ticker = a.get("ticker", "PORTFOLIO")
            z = a.get("z_score", 0.0)
            ret = a.get("return", 0.0)
            reason = a.get("trigger_reason") or a.get("reason", "Anomaly detected")

            severity = "CRITICAL" if abs(z) > 3.0 or (mdd and abs(mdd) > abs(request.drawdown_tolerance)) else "WARNING"
            category = "DRAWDOWN" if ticker == "PORTFOLIO" else ("VOLATILITY" if "volatility" in reason.lower() else "RETURN_SPIKE")

            structured_alerts.append(AlertItem(
                id=f"alert_{i+1}_{ticker}",
                ticker=ticker,
                severity=severity,
                category=category,
                title=f"{ticker}: {category.replace('_', ' ').title()}",
                description=a.get("explanation") or f"Triggered on {reason}",
                trigger_reason=reason,
                return_value=ret,
                z_score=z,
                citations=a.get("citations") or []
            ))

        # Check for ML multivariate anomalies
        if not portfolio.prices.empty and len(portfolio.prices) > 20:
            returns_df = portfolio.prices.pct_change().dropna()
            iso_anomalies = detect_multivariate_anomalies(returns_df)
            for j, iso in enumerate(iso_anomalies):
                if not any(al.ticker == iso["ticker"] for al in structured_alerts):
                    structured_alerts.append(AlertItem(
                        id=f"iso_alert_{j+1}_{iso['ticker']}",
                        ticker=iso["ticker"],
                        severity="WARNING",
                        category="VOLATILITY",
                        title=f"{iso['ticker']}: Joint Return/Vol Outlier",
                        description=iso["explanation"],
                        trigger_reason="Isolation Forest Multivariate Pattern",
                        return_value=iso["return_value"],
                        z_score=iso["z_score"]
                    ))

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        # Persist complete run to SQLite agent memory under user_id
        run_record = {
            "session_id": results.get("session_id", "default"),
            "mandate": request.mandate,
            "days": request.days,
            "drawdown_tolerance": request.drawdown_tolerance,
            "portfolio_snapshot": [h.model_dump() for h in holdings_items],
            "risk_metrics": risk_metrics,
            "alerts": [a.model_dump() for a in structured_alerts],
            "news_analyses": results.get("news_analyses", []),
            "drift_analysis": results.get("drift_analysis", {}),
            "forecast": results.get("forecast", {}),
            "briefing": results.get("briefing", ""),
            "trace": results.get("trace", ""),
            "orchestrator_engine": results.get("orchestrator_engine", "LangGraph StateGraph")
        }
        save_agent_run(current_user["id"], run_record)

        return MonitorResponse(
            status="success",
            message="Investment analysis completed successfully.",
            portfolio_value=latest_val,
            health_score=health_score,
            risk_meter=risk_meter,
            diversification=diversification,
            risk_metrics=risk_metrics,
            alerts=structured_alerts,
            briefing=results.get("briefing"),
            forecast=results.get("forecast"),
            trace=results.get("trace"),
            execution_time_ms=round(elapsed_ms, 2)
        )

    except Exception as e:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Monitoring execution encountered an error: {str(e)}"
        )


@router.get("/portfolio/risk")
async def get_risk_metrics(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve computed quantitative risk metrics from SQLite for the authenticated user."""
    latest_run = get_latest_agent_run(current_user["id"])
    if latest_run:
        weights_dict = {}
        for h in latest_run.get("portfolio_snapshot", []):
            weights_dict[h["symbol"]] = h.get("weight", 0.0)

        risk_metrics = latest_run.get("risk_metrics", {})
        health_score = portfolio_service.calculate_health_score(
            weights=weights_dict,
            volatility=risk_metrics.get("annualized_volatility"),
            sharpe_ratio=risk_metrics.get("sharpe_ratio"),
            max_drawdown=risk_metrics.get("max_drawdown")
        )

        risk_meter = portfolio_service.calculate_risk_meter(
            volatility=risk_metrics.get("annualized_volatility"),
            max_drawdown=risk_metrics.get("max_drawdown"),
            var_95=risk_metrics.get("historical_var_95")
        )

        return {
            "status": "success",
            "metrics": risk_metrics,
            "health_score": health_score.model_dump(),
            "risk_meter": risk_meter.model_dump(),
            "briefing": latest_run.get("briefing"),
            "trace": latest_run.get("trace"),
            "news_analyses": latest_run.get("news_analyses", []),
            "alerts": latest_run.get("alerts", []),
            "orchestrator_engine": latest_run.get("orchestrator_engine", "LangGraph StateGraph")
        }

    return {
        "status": "pending",
        "message": "No monitoring runs recorded yet. Upload a portfolio and launch the agents to generate a report."
    }


@router.get("/portfolio/alerts", response_model=List[AlertItem])
async def get_active_alerts(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve active risk alerts for the authenticated user from SQLite."""
    latest_run = get_latest_agent_run(current_user["id"])
    if latest_run and "alerts" in latest_run:
        return [AlertItem(**a) for a in latest_run["alerts"]]
    return []


@router.get("/portfolio/health", response_model=PortfolioHealthScore)
async def get_portfolio_health(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get portfolio health score breakdown for current user."""
    latest_run = get_latest_agent_run(current_user["id"])
    if latest_run:
        weights_dict = {h["symbol"]: h.get("weight", 0.0) for h in latest_run.get("portfolio_snapshot", [])}
        risk_metrics = latest_run.get("risk_metrics", {})
        return portfolio_service.calculate_health_score(
            weights=weights_dict,
            volatility=risk_metrics.get("annualized_volatility"),
            sharpe_ratio=risk_metrics.get("sharpe_ratio"),
            max_drawdown=risk_metrics.get("max_drawdown")
        )

    holdings_data = get_user_portfolio(current_user["id"])
    if holdings_data:
        n = len(holdings_data)
        weights = {h["symbol"]: 1.0 / n for h in holdings_data} if n else {}
        return portfolio_service.calculate_health_score(weights)

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No portfolio loaded.")


@router.get("/portfolio/diversification", response_model=DiversificationAnalysis)
async def get_portfolio_diversification(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get diversification analysis and sector concentration for current user."""
    holdings_data = get_user_portfolio(current_user["id"])
    if holdings_data:
        n = len(holdings_data)
        weights = {h["symbol"]: float(h.get("weight") or (1.0 / n)) for h in holdings_data}
        holdings = [
            HoldingItem(
                symbol=h["symbol"],
                quantity=float(h["quantity"]),
                weight=weights.get(h["symbol"], 0.0),
                target_weight=float(h["target_weight"]) if h.get("target_weight") is not None else None,
                sector=h.get("sector")
            )
            for h in holdings_data
        ]
        return portfolio_service.calculate_diversification(holdings, weights)

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No portfolio loaded.")
