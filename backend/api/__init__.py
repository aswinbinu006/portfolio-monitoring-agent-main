import sys
from pathlib import Path

# Ensure backend directory and repo root are in sys.path
api_dir = Path(__file__).resolve().parent
backend_dir = api_dir.parent
repo_root = backend_dir.parent
for directory in (str(repo_root), str(backend_dir)):
    if directory not in sys.path:
        sys.path.insert(0, directory)

try:
    from backend.api.main import app, create_app
except ImportError:
    from api.main import app, create_app

__all__ = ["app", "create_app"]

