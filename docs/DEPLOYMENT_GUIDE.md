# Deployment Guide: FastAPI Backend + Next.js Frontend

## Architecture Overview

```
┌─────────────────────────┐       ┌──────────────────────────┐
│   Vercel (Frontend)     │       │  HuggingFace Docker Space│
│   Next.js App           │◄──────┤  FastAPI Backend         │
│   - Portfolio Upload    │ HTTPS │  - Orchestrator          │
│   - Dashboard UI        │       │  - All Agents (unchanged)│
│   - Risk/Alerts/Trace   │       │  - Core/Data (unchanged) │
└─────────────────────────┘       └──────────────────────────┘
         FREE                               FREE
    (No timeout)                      (No 60s limit)
```

## Why This Architecture?

**Problem**: Vercel's free tier has 60-second timeout limits even after configuration.
**Solution**: Keep Python backend on HuggingFace Docker Space (no limits), only frontend on Vercel.

## Backend Deployment (HuggingFace Docker Space)

### Step 1: Update README.md Frontmatter

Already updated in `README_FOR_HF.md`:

```yaml
---
title: Portfolio Monitoring Agent
emoji: 📊
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
license: mit
---
```

### Step 2: Push to HuggingFace

```bash
cd portfolio_agent

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Add FastAPI backend with Docker"

# Add HuggingFace remote
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/portfolio-monitoring-agent

# Push
git push hf main
```

### Step 3: Configure Environment Variables

In HuggingFace Spaces Settings → Variables and secrets:

- `GOOGLE_API_KEY` (Secret ✓)
- `GROQ_API_KEY` (Secret ✓)
- `TAVILY_API_KEY` (Secret ✓)
- `MARKETAUX_API_KEY` (Secret ✓)
- `HF_TOKEN` (Secret ✓)

### Step 4: Wait for Docker Build

HuggingFace will:
1. Build the Dockerfile
2. Install requirements
3. Start FastAPI on port 7860
4. Provide a URL: `https://YOUR_USERNAME-portfolio-monitoring-agent.hf.space`

## Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy Frontend

```bash
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel
```

Follow prompts:
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- Project name? **portfolio-monitoring-frontend**
- Directory: **./frontend** (current directory)
- Override settings? **N**

### Step 3: Configure Environment Variable

In Vercel Dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Add variable:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://YOUR_USERNAME-portfolio-monitoring-agent.hf.space`
   - Environment: Production, Preview, Development

### Step 4: Redeploy

```bash
vercel --prod
```

Your frontend will be live at: `https://portfolio-monitoring-frontend.vercel.app`

## Local Development

### Backend (FastAPI)

```bash
cd portfolio_agent

# Activate virtual environment
.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate    # Mac/Linux

# Install FastAPI dependencies
pip install fastapi uvicorn[standard] python-multipart

# Run backend
cd backend
python api.py

# Or with uvicorn directly
uvicorn api:app --reload --port 7860
```

Backend runs at: http://localhost:7860

Test endpoints:
- http://localhost:7860/docs (Swagger UI)
- http://localhost:7860/ (Health check)

### Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs at: http://localhost:3000

## Testing the Integration

### 1. Test Backend Health

```bash
curl http://localhost:7860/
```

Expected response:
```json
{
  "status": "ok",
  "service": "Portfolio Monitoring Agent API",
  "version": "1.0.0",
  "model": "Gemini 2.0 Flash"
}
```

### 2. Test Portfolio Upload

```bash
curl -X POST http://localhost:7860/api/portfolio/upload \
  -F "file=@sample_portfolio.csv"
```

### 3. Test Frontend

1. Open http://localhost:3000
2. Navigate to Portfolio page
3. Upload CSV
4. Run analysis
5. View results in other tabs

## Production URLs

After deployment:

- **Backend API**: https://YOUR_USERNAME-portfolio-monitoring-agent.hf.space
- **Frontend**: https://portfolio-monitoring-frontend.vercel.app
- **API Docs**: https://YOUR_USERNAME-portfolio-monitoring-agent.hf.space/docs

## Troubleshooting

### Backend Issues

**Build fails on HuggingFace?**
- Check Dockerfile syntax
- Verify requirements-core.txt exists
- Check logs in Space

**API returns 500?**
- Check environment variables are set
- View logs in HuggingFace Space
- Test locally first

### Frontend Issues

**CORS errors?**
- Ensure NEXT_PUBLIC_API_URL is set correctly
- Check CORS middleware in backend allows your Vercel URL
- Update `allow_origins` in backend/api.py

**API calls fail?**
- Verify NEXT_PUBLIC_API_URL environment variable
- Check network tab in browser dev tools
- Ensure backend is running

### Timeout Issues

**If analysis still times out:**
- Backend on HuggingFace has NO timeout limits
- Only Vercel frontend has 60s limit
- Since analysis runs on backend, it should complete
- Frontend just waits for response (no timeout on client fetch)

## Cost Summary

### HuggingFace Docker Space
- **FREE** for CPU basic
- Upgrade to GPU if needed (~$0.60/hr)

### Vercel
- **FREE** for hobby projects
- Unlimited bandwidth
- No timeout limits on API calls FROM frontend
- Frontend deployment only

## Important Notes

1. **mcp/server.py is NOT touched** - it remains for MCP demonstration only
2. **All agent code unchanged** - config.py, .env, core/, agents/, data/ all stay the same
3. **Only interface layer replaced** - Gradio → FastAPI + Next.js
4. **API keys stay server-side** - frontend only has API_URL

## Next Steps

1. Deploy backend to HuggingFace
2. Get backend URL
3. Deploy frontend to Vercel with backend URL
4. Test end-to-end
5. Share your live URL! 🚀
