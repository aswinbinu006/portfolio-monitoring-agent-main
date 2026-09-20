# 🚀 Separate Deployment Guide: Backend & Frontend

This repository is structured as a decoupled monorepo, allowing you to deploy the **Backend (FastAPI)** and **Frontend (Next.js)** independently to whatever hosting services you prefer.

---

## 📁 Repository Structure

```
portfolio-monitoring-agent/
├── backend/                  # Standalone FastAPI Python Backend
│   ├── agents/               # Multi-agent implementations
│   ├── core/                 # Portfolio risk, metrics, anomaly detection
│   ├── crew/                 # CrewAI workflows
│   ├── data/                 # Market data fetchers & offline datasets
│   ├── eval/                 # Evaluation scripts & test suites
│   ├── graph/                # LangGraph flow orchestrator
│   ├── guardrails/           # Guardrails & safety validators
│   ├── mcp/                  # Model Context Protocol servers
│   ├── memory/               # Persistent episodic memory
│   ├── n8n/                  # n8n workflows
│   ├── scripts/              # Helper utilities
│   ├── tools/                # Agent tools
│   ├── api.py                # FastAPI server entry point
│   ├── app.py                # Optional Gradio dashboard
│   ├── app_hf.py             # HuggingFace Gradio launcher
│   ├── config.py             # System configuration & model routing
│   ├── Dockerfile            # Standalone container build
│   ├── requirements.txt      # Backend Python dependencies
│   ├── sample_portfolio.csv  # Sample portfolio data
│   ├── .env.example          # Environment variables template
│   └── .gitignore            # Backend gitignore rules
│
├── frontend/                 # Standalone Next.js 14 Web Frontend
│   ├── app/                  # Next.js App Router pages
│   │   ├── portfolio/        # CSV upload & mandate config
│   │   ├── dashboard/        # Metrics & holdings charts
│   │   ├── risk/             # VaR, drawdown, downside metrics
│   │   ├── alerts/           # Two-stage anomalies & news citations
│   │   ├── forecast/         # ML volatility predictions
│   │   └── trace/            # Agent execution logs
│   ├── components/           # UI components
│   ├── lib/                  # API client & TypeScript interfaces (api.ts)
│   ├── package.json          # Frontend dependencies & scripts
│   ├── vercel.json           # Vercel deployment configuration
│   ├── .env.example          # Frontend environment variables template
│   └── .gitignore            # Frontend gitignore rules
│
├── docs/                     # Project documentation & guides
├── .gitignore                # Global gitignore protecting all .env files
└── README.md                 # Project overview & quick start
```

---

## Part 1: Deploying the Backend Separately

The `backend/` folder contains everything required to run and deploy the FastAPI service.

### Option A: Deploy to Hugging Face Spaces (Recommended Free Tier)

1. Create a new Space at [huggingface.co/new-space](https://huggingface.co/new-space):
   - **SDK**: `Docker`
   - **Space Hardware**: `CPU basic (free)`
   - **Visibility**: `Public`
2. Push only the `backend/` directory or push the repository:
   - If pushing the whole repo, Hugging Face can use `backend/Dockerfile` as the build context.
   - Or push the contents of `backend/` directly to the Hugging Face git remote:
     ```bash
     cd backend
     git init
     git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/portfolio-monitoring-backend
     git add .
     git commit -m "Deploy FastAPI Backend"
     git push hf main --force
     ```
3. In Hugging Face Space → **Settings** → **Variables and secrets**, add:
   - `GOOGLE_API_KEY`
   - `GROQ_API_KEY`
   - `TAVILY_API_KEY`
   - `MARKETAUX_API_KEY`
   - `HF_TOKEN`
   - `CORS_ORIGINS` = `*` (or your Vercel URL once deployed)
4. Your backend API will be live at:
   ```
   https://YOUR_USERNAME-portfolio-monitoring-backend.hf.space
   ```
   Interactive Swagger documentation is available at `/docs`.

### Option B: Deploy to Render / Railway / AWS / GCP

1. Point your service to the `backend/` directory as root directory.
2. Build command:
   ```bash
   pip install -r requirements.txt
   ```
3. Start command:
   ```bash
   uvicorn api:app --host 0.0.0.0 --port $PORT
   ```
4. Set required environment variables from `backend/.env.example`.

### Local Backend Execution

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python api.py
```
Backend will start on `http://localhost:7860`.

---

## Part 2: Deploying the Frontend Separately

The `frontend/` directory is an independent Next.js application.

### Option A: Deploy to Vercel (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new) and import your Git repository.
2. Under **Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
3. Add Environment Variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your deployed backend URL (e.g., `https://YOUR_USERNAME-portfolio-monitoring-backend.hf.space`)
4. Click **Deploy**.
5. Your frontend will be live at `https://your-app.vercel.app`.

### Option B: Deploy to Netlify / Cloudflare Pages

- Set the base directory to `frontend/`.
- Build command: `npm run build`
- Publish directory: `frontend/.next` or export.
- Set `NEXT_PUBLIC_API_URL` in environment settings.

### Local Frontend Execution

```bash
cd frontend
npm install
npm run dev
```
Frontend will be accessible at `http://localhost:3000`.

---

## Part 3: Connecting Frontend & Backend (CORS)

By default, `backend/api.py` permits cross-origin requests (`CORS_ORIGINS=*`).

For production security:
1. In your backend environment settings, set:
   ```
   CORS_ORIGINS=https://your-app.vercel.app,https://*.vercel.app,http://localhost:3000
   ```
2. Restart the backend service.
