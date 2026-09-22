"""
FastAPI Main Application Factory.
Provides structured error responses, institutional security middleware,
CORS whitelisting, and modular routers.
"""
import os
import sys
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

# Ensure paths are discoverable
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
root_dir = backend_dir.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.server.middleware.security import SecurityHeadersMiddleware
from backend.server.middleware.logging import RequestLoggingMiddleware
from backend.server.routers.system import router as system_router
from backend.server.routers.portfolio import router as portfolio_router
from backend.server.routers.analysis import router as analysis_router
from backend.server.routers.forecast import router as forecast_router
from backend.server.routers.market import router as market_router


def create_app() -> FastAPI:
    """Creates and configures the production FastAPI instance."""
    app = FastAPI(
        title="Investment Portfolio Monitoring Agent API",
        description="Institutional-grade multi-agent engine for portfolio risk monitoring, anomaly detection, and forecasting.",
        version="2.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )

    # 1. Institutional Security & Logging Middleware
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    # 2. CORS Whitelisting
    cors_env = os.getenv("CORS_ORIGINS", "*")
    if cors_env.strip() == "*":
        allowed_origins = ["*"]
    else:
        allowed_origins = [origin.strip() for origin in cors_env.split(",") if origin.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
        allow_headers=["*"],
    )

    # 3. Global Structured Exception Handlers (Never expose raw stack traces)
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        req_id = getattr(request.state, "request_id", None)
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": exc.detail,
                },
                "request_id": req_id
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        req_id = getattr(request.state, "request_id", None)
        error_messages = [f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in exc.errors()]
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "; ".join(error_messages),
                    "details": {"validation_errors": exc.errors()}
                },
                "request_id": req_id
            }
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        req_id = getattr(request.state, "request_id", None)
        import logging
        logging.getLogger("fintech.api").exception(f"Unhandled Exception on {request.url.path} (ID: {req_id})")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred while processing the request. Please contact system support.",
                },
                "request_id": req_id
            }
        )

    # 4. Mount Routers
    app.include_router(system_router)
    app.include_router(portfolio_router)
    app.include_router(analysis_router)
    app.include_router(forecast_router)
    app.include_router(market_router)

    return app


app = create_app()
