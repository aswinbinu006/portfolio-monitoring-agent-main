# 📊 Investment Portfolio Monitoring Agent

An AI-powered multi-agent system for real-time portfolio analysis, risk monitoring, two-stage anomaly detection, and intelligent ML volatility forecasting.

The repository is organized into independent folders for the **Backend** (FastAPI), **Frontend** (Next.js), and **Docs**, allowing standalone development and separate deployments (e.g. Backend on Hugging Face Docker Space or Render, and Frontend on Vercel or Netlify).

---

## 📁 Repository Structure

| Directory | Description | Primary Tech Stack |
| :--- | :--- | :--- |
| [`backend/`](file:///backend) | Full multi-agent engine & FastAPI REST server | Python 3.11, FastAPI, LiteLLM, scikit-learn, yfinance |
| [`frontend/`](file:///frontend) | Modern web dashboard & interactive analytics | Next.js 14, React 18, TailwindCSS, Axios |
| [`docs/`](file:///docs) | Comprehensive deployment, architecture & quickstart guides | Markdown documentation |

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and supply your API keys (Google, Groq, Tavily, Marketaux)

# Run FastAPI backend server (default port 7860)
python api.py
```
- API Health Check: `http://localhost:7860/`
- Interactive OpenAPI Docs: `http://localhost:7860/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to http://localhost:7860

# Run Next.js dev server (default port 3000)
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Separate Deployment

See [`docs/DEPLOYMENT_SEPARATE.md`](file:///docs/DEPLOYMENT_SEPARATE.md) for full step-by-step instructions.

### Deploy Backend (Hugging Face Spaces or Render)
- **Hugging Face Docker Space**: Point directly to `backend/` or push `backend/` using Docker SDK.
- **Render / Railway**: Set Root Directory to `backend`, Build Command `pip install -r requirements.txt`, Start Command `uvicorn api:app --host 0.0.0.0 --port $PORT`.

### Deploy Frontend (Vercel)
- Import the repository in Vercel.
- Set **Root Directory** to `frontend`.
- Add environment variable `NEXT_PUBLIC_API_URL` set to your deployed backend URL.

---

## 🔒 Environment Variable Protection

All environment files (`.env`, `.env.*`, `*.env`, `backend/.env*`, `frontend/.env*`) are safely excluded in `.gitignore`. Example template files are provided:
- Root template: [`.env.example`](file:///c:/Users/aswin/OneDrive/Documents/portfolio-monitoring-agent-main/.env.example)
- Backend template: [`backend/.env.example`](file:///backend/.env.example)
- Frontend template: [`frontend/.env.example`](file:///frontend/.env.example)

---

## 📚 Documentation Index

Detailed guides located in [`docs/`](file:///docs):
- [Separate Deployment Guide](file:///docs/DEPLOYMENT_SEPARATE.md)
- [GitHub & Vercel Deployment](file:///docs/GITHUB_VERCEL_DEPLOY.md)
- [Hugging Face Deployment](file:///docs/DEPLOY_TO_HF.md)
- [Quickstart Guide](file:///docs/QUICKSTART.md)
- [Project Architecture & Summary](file:///docs/PROJECT_SUMMARY.md)

---

## ⚖️ License
MIT License. Free to use, modify, and distribute.

*Disclaimer: This is a risk monitoring and explanation tool, not a financial trading directive system.*
