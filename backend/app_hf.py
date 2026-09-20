"""
Hugging Face Spaces version of Portfolio Monitoring Agent.
Optimized for HF Spaces deployment with proper configuration.
"""
import os
import sys
from pathlib import Path

# Set environment for HF Spaces
os.environ.setdefault("GRADIO_SERVER_NAME", "0.0.0.0")
os.environ.setdefault("GRADIO_SERVER_PORT", "7860")

# Import main app
sys.path.insert(0, str(Path(__file__).parent))

from app import main

if __name__ == "__main__":
    main()
