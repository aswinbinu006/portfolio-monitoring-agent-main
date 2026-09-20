# Dockerfile for Portfolio Monitoring Agent Backend
# Deploys to Hugging Face Docker Space (free tier, no timeout limits)

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Environment variables will be set via HuggingFace Spaces Settings or container runtime
# (GOOGLE_API_KEY, GROQ_API_KEY, TAVILY_API_KEY, MARKETAUX_API_KEY, HF_TOKEN)

# Expose port
EXPOSE 7860

# Run FastAPI backend
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860"]
