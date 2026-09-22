"""
Analysis, Risk, and Alerts Router.
Triggers multi-agent monitoring cycles and exposes institutional quantitative analytics.
"""
import time
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException

from backend.server.schemas.common import (
    MonitorRequest,
    MonitorResponse,
    RiskMetricsSummary,
    AlertItem,
    PortfolioHealthScore,
    DiversificationAnalysis,
    HoldingItem,
)
from backend.server.state import app_state
from backend.server.services.portfolio_service import portfolio_service, get_sector_for_ticker
from backend.core.anomaly import detect_anomalies_isolation_forest
from backend.agents.orchestrator import Orchestrator

router = APIRouter(prefix="/api", tags=["Analysis & Risk"])


@router.post("/monitor/run", response_model=MonitorResponse)
async def run_monitoring(request: MonitorRequest):
    if app_state.current_portfolio is None:
        raise HTTPException(
            status_code=400,
            detail="No portfolio loaded. Please upload a portfolio CSV first."
        )

    start_time = time.perf_counter()

    try:
        if request.mandate == "conservative":
            app_state.current_portfolio.risk_free_rate = 0.065
        elif request.mandate == "balanced":
            app_state.current_portfolio.risk_free_rate = 0.060
        elif request.mandate == "aggressive":
            app_state.current_portfolio.risk_free_rate = 0.055

        orchestrator = Orchestrator()
        results = orchestrator.run_full_analysis(
            portfolio=app_state.current_portfolio,
            days=request.days,
            mandate=request.mandate,
            drawdown_tolerance=request.drawdown_tolerance
        )

        app_state.latest_results = results

        latest_val = None
        weights_dict = {}
        if not app_state.current_portfolio.prices.empty:
            try:
                latest_val = float(app_state.current_portfolio.get_portfolio_value())
                weights_dict = app_state.current_portfolio.get_weights()
            except Exception:
                pass

        if not weights_dict and app_state.current_portfolio.holdings:
            n = len(app_state.current_portfolio.holdings)
            weights_dict = {h.ticker: 1.0 / n for h in app_state.current_portfolio.holdings}

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
            for h in app_state.current_portfolio.holdings
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

        if not app_state.current_portfolio.prices.empty and len(app_state.current_portfolio.prices) > 20:
            returns_df = app_state.current_portfolio.prices.pct_change().dropna()
            iso_anomalies = detect_anomalies_isolation_forest(returns_df)
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

        results["health_score"] = health_score.model_dump()
        results["risk_meter"] = risk_meter.model_dump()
        results["diversification"] = diversification.model_dump()
        results["structured_alerts"] = [a.model_dump() for a in structured_alerts]

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

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
            status_code=500,
            detail=f"Monitoring execution encountered an error: {str(e)}"
        )


@router.get("/portfolio/risk")
async def get_risk_metrics():
    if app_state.current_portfolio is None:
        raise HTTPException(
            status_code=400,
            detail="No portfolio loaded. Please upload CSV first."
        )

    if app_state.latest_results and app_state.latest_results.get("risk_metrics"):
        return {
            "status": "success",
            "metrics": app_state.latest_results.get("risk_metrics"),
            "health_score": app_state.latest_results.get("health_score"),
            "risk_meter": app_state.latest_results.get("risk_meter"),
            "diversification": app_state.latest_results.get("diversification")
        }

    return {
        "status": "pending",
        "message": "Run monitoring analysis from Portfolio view to compute full quantitative metrics."
    }


@router.get("/portfolio/alerts", response_model=List[AlertItem])
async def get_active_alerts():
    if app_state.latest_results and "structured_alerts" in app_state.latest_results:
        return [AlertItem(**a) for a in app_state.latest_results["structured_alerts"]]
    return []


@router.get("/portfolio/health", response_model=PortfolioHealthScore)
async def get_portfolio_health():
    if app_state.latest_results and "health_score" in app_state.latest_results:
        return PortfolioHealthScore(**app_state.latest_results["health_score"])

    if app_state.current_portfolio:
        n = len(app_state.current_portfolio.holdings)
        weights = {h.ticker: 1.0 / n for h in app_state.current_portfolio.holdings} if n else {}
        return portfolio_service.calculate_health_score(weights)

    raise HTTPException(status_code=400, detail="No portfolio loaded.")


@router.get("/portfolio/diversification", response_model=DiversificationAnalysis)
async def get_portfolio_diversification():
    if app_state.latest_results and "diversification" in app_state.latest_results:
        return DiversificationAnalysis(**app_state.latest_results["diversification"])

    if app_state.current_portfolio:
        n = len(app_state.current_portfolio.holdings)
        weights = {h.ticker: 1.0 / n for h in app_state.current_portfolio.holdings} if n else {}
        holdings = [
            HoldingItem(
                symbol=h.ticker,
                quantity=h.quantity,
                weight=weights.get(h.ticker, 0.0),
                target_weight=h.target_weight,
                sector=get_sector_for_ticker(h.ticker)
            )
            for h in app_state.current_portfolio.holdings
        ]
        return portfolio_service.calculate_diversification(holdings, weights)

    raise HTTPException(status_code=400, detail="No portfolio loaded.")
