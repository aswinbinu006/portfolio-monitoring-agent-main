# Deployment Guide for Portfolio Monitoring Agent

## Option 1: Hugging Face Spaces (RECOMMENDED for Gradio)

Hugging Face Spaces is free and designed specifically for Gradio apps.

### Steps:

1. **Create account at https://huggingface.co/**

2. **Create a new Space:**
   - Go to https://huggingface.co/new-space
   - Name: `portfolio-monitoring-agent`
   - License: MIT
   - SDK: Gradio
   - Hardware: CPU Basic (free) or upgrade for faster performance

3. **Prepare files:**
   ```bash
   # Create a .gitignore if not exists
   echo ".env" >> .gitignore
   echo "__pycache__/" >> .gitignore
   echo "*.pyc" >> .gitignore
   echo ".cache/" >> .gitignore
   ```

4. **Push to Hugging Face:**
   ```bash
   cd portfolio_agent
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://huggingface.co/spaces/YOUR_USERNAME/portfolio-monitoring-agent
   git push -u origin main
   ```

5. **Set Environment Variables in Spaces:**
   - Go to Space Settings > Variables and secrets
   - Add your API keys:
     - GOOGLE_API_KEY
     - GROQ_API_KEY
     - TAVILY_API_KEY
     - MARKETAUX_API_KEY
     - HF_TOKEN

6. **Your app will be live at:**
   `https://huggingface.co/spaces/YOUR_USERNAME/portfolio-monitoring-agent`

---

## Option 2: Vercel (Requires FastAPI/Flask Conversion)

Vercel is serverless and requires converting your Gradio app to a FastAPI/Flask API.

### What needs to change:
- Remove Gradio UI
- Create REST API endpoints
- Build separate frontend (React/Next.js)
- Handle timeouts (max 60s on free tier)

### Steps:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Create API version** (create `api/index.py`):
   ```python
   from fastapi import FastAPI, UploadFile
   from fastapi.middleware.cors import CORSMiddleware
   import sys
   from pathlib import Path
   
   sys.path.insert(0, str(Path(__file__).parent.parent))
   
   from core.portfolio import Portfolio
   from agents.orchestrator import Orchestrator
   
   app = FastAPI()
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],
       allow_methods=["*"],
       allow_headers=["*"],
   )
   
   @app.post("/api/analyze")
   async def analyze_portfolio(file: UploadFile, mandate: str = "balanced"):
       # Save uploaded file
       contents = await file.read()
       temp_path = f"/tmp/{file.filename}"
       with open(temp_path, 'wb') as f:
           f.write(contents)
       
       # Load and analyze
       portfolio = Portfolio.from_csv(temp_path)
       orchestrator = Orchestrator()
       results = orchestrator.run_full_analysis(
           portfolio=portfolio,
           days=90,
           mandate=mandate,
           drawdown_tolerance=-0.15
       )
       
       return results
   
   @app.get("/api/health")
   def health():
       return {"status": "ok"}
   ```

3. **Create `vercel.json`:**
   ```json
   {
     "builds": [
       {
         "src": "api/index.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "api/index.py"
       }
     ],
     "env": {
       "GOOGLE_API_KEY": "@google_api_key",
       "GROQ_API_KEY": "@groq_api_key",
       "TAVILY_API_KEY": "@tavily_api_key",
       "MARKETAUX_API_KEY": "@marketaux_api_key"
     }
   }
   ```

4. **Deploy:**
   ```bash
   vercel
   ```

5. **Set environment variables:**
   ```bash
   vercel env add GOOGLE_API_KEY
   vercel env add GROQ_API_KEY
   vercel env add TAVILY_API_KEY
   vercel env add MARKETAUX_API_KEY
   ```

### Limitations on Vercel:
- 60 second timeout on Hobby (free) plan
- Serverless functions are stateless
- No persistent storage
- May timeout during long-running ML forecasts

---

## Option 3: Railway (Good Balance)

Railway offers generous free tier with persistent containers (better for Gradio).

### Steps:

1. **Create account at https://railway.app/**

2. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

3. **Login and deploy:**
   ```bash
   railway login
   cd portfolio_agent
   railway init
   railway up
   ```

4. **Set environment variables:**
   ```bash
   railway variables set GOOGLE_API_KEY=your_key
   railway variables set GROQ_API_KEY=your_key
   railway variables set TAVILY_API_KEY=your_key
   railway variables set MARKETAUX_API_KEY=your_key
   ```

5. **App will be live at your Railway URL**

---

## Option 4: Render (Simple & Free)

Render offers free web services perfect for Gradio apps.

### Steps:

1. **Push code to GitHub**

2. **Go to https://render.com/**

3. **New > Web Service**

4. **Connect your GitHub repo**

5. **Configure:**
   - Name: `portfolio-monitoring-agent`
   - Environment: Python 3
   - Build Command: `pip install -r requirements-core.txt`
   - Start Command: `python app.py`

6. **Add Environment Variables** in dashboard

7. **Deploy!**

---

## Comparison:

| Platform | Best For | Cost | Complexity | Timeout |
|----------|----------|------|------------|---------|
| **Hugging Face Spaces** | Gradio apps | Free | ⭐ Easy | None |
| **Railway** | Containers | $5 credit/mo | ⭐⭐ Medium | None |
| **Render** | Web services | Free tier | ⭐⭐ Medium | None |
| **Vercel** | APIs/Frontend | Free | ⭐⭐⭐ Hard | 60s |

## Recommendation:

**For your Gradio app → Use Hugging Face Spaces** (easiest, free, designed for this)

**For production API → Use Railway or Render** (no timeout issues)

**For static frontend → Use Vercel** (after converting to API + React)
