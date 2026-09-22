"""
FastAPI Backend Application Package.
Exports app instance and factory function.
"""
from backend.api.main import app, create_app

__all__ = ["app", "create_app"]
