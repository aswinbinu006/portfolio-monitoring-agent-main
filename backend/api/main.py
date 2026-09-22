"""
FastAPI Application for Multi-Agent Portfolio Monitoring.
Exposes endpoints for portfolio CSV ingestion, LangGraph multi-agent execution,
and LLM synthesis briefing delivery.
"""
import os
from typing import List
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    import config
except ImportError:
    from backend import config

from backend.utils.logger import logger
from backend.api.routers import (
    system_router,
    portfolio_router,
    analysis_router,
    forecast_router,
    market_router,
)


def create_app() -> FastAPI:
    """
    Constructs the FastAPI application hosting the multi-agent system.
    """
    app = FastAPI(
        title="Investment Portfolio Monitoring — Agentic AI Platform",
        description="LangGraph-orchestrated 7-agent system for portfolio risk monitoring and LLM synthesis.",
        version="2.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Standard CORS for local development and academic demonstration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Structured error handling
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": "HTTP_ERROR",
                    "message": str(exc.detail),
                },
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid request parameters.",
                    "details": exc.errors(),
                },
            },
        )

    # Mount API feature routers
    app.include_router(system_router)
    app.include_router(portfolio_router)
    app.include_router(analysis_router)
    app.include_router(forecast_router)
    app.include_router(market_router)

    return app


app = create_app()
