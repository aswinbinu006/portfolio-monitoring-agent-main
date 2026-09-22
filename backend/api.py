"""
FastAPI Entry Point for Investment Portfolio Monitoring Agent.
Exports production `app` instance with institutional routers, security middleware,
and clean architecture.
"""
import os
import sys
from pathlib import Path

# Add backend directory and its parent to sys.path
backend_dir = Path(__file__).resolve().parent
parent_dir = backend_dir.parent
for directory in (str(backend_dir), str(parent_dir)):
    if directory not in sys.path:
        sys.path.insert(0, directory)

try:
    from backend.api.main import app, create_app
except ImportError:
    from api.main import app, create_app

import config

# Export app for ASGI servers (uvicorn api:app or uvicorn backend.api:app)
__all__ = ["app", "create_app"]


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 7860))

    print("=" * 65)
    print("  INVESTMENT PORTFOLIO MONITORING AGENT — REST API ENGINE")
    print("=" * 65)
    print(f"  Model:       {config.get_primary_model()['name']}")
    print(f"  Port:        {port}")
    print("  Environment: Production Fintech Architecture (v2.0)")
    print("=" * 65)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=False
    )
