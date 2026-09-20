# 🚀 Deploy to Vercel - Quick Start

## Prerequisites

✅ HuggingFace account (https://huggingface.co)
✅ Vercel account (https://vercel.com)
✅ Git installed

## Step 1: Deploy Backend to HuggingFace (5 minutes)

### 1.1 Create HuggingFace Space

1. Go to https://huggingface.co/new-space
2. Fill in:
   - **Space name**: `portfolio-monitoring-backend`
   - **SDK**: Docker
   - **Visibility**: Public
3. Click "Create Space"

### 1.2 Push Backend Code

```powershell
# Navigate to project
cd "c:\Users\jayes\OneDrive\Desktop\flexi miniproject\portfolio_agent"

# Initialize git (if not already)
git init

# Add files
git add .

# Commit
git commit -m "Add FastAPI backend with Docker"

# Add HuggingFace remote (replace YOUR_USERNAME)
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/portfolio-monitoring-backend

# Push to HuggingFace
git push hf main
```

If prompted for credentials:
- **Username**: Your HuggingFace username
- **Password**: Use a token from https://huggingface.co/settings/tokens

### 1.3 Set Environment Variables

In HuggingFace Space → Settings → Variables and secrets:

| Name | Value | Secret? |
|------|-------|---------|
| `GOOGLE_API_KEY` | [Your Gemini key from .env] | ✓ |
| `GROQ_API_KEY` | [Your Groq key from .env] | ✓ |
| `TAVILY_API_KEY` | [Your Tavily key from .env] | ✓ |
| `MARKETAUX_API_KEY` | [Your Marketaux key from .env] | ✓ |

### 1.4 Wait for Build

- HuggingFace will build the Docker image (2-5 minutes)
- Check the "Logs" tab for progress
- Once running, your backend will be at:
  ```
  https://YOUR_USERNAME-portfolio-monitoring-backend.hf.space
  ```

**Test it**: Visit `https://YOUR_USERNAME-portfolio-monitoring-backend.hf.space/docs`

---

## Step 2: Deploy Frontend to Vercel (3 minutes)

### 2.1 Install Vercel CLI

```powershell
npm install -g vercel
```

### 2.2 Login to Vercel

```powershell
vercel login
```

This will open your browser. Log in with GitHub/GitLab/Bitbucket.

### 2.3 Deploy Frontend

```powershell
cd frontend
npm install
vercel
```

Answer prompts:
- **Set up and deploy?** Y
- **Which scope?** [Your account]
- **Link to existing project?** N
- **What's your project's name?** portfolio-monitoring-frontend
- **In which directory is your code located?** ./
- **Want to override settings?** N

### 2.4 Set Backend URL

After deployment, configure the environment variable:

```powershell
# Replace with YOUR HuggingFace Space URL
vercel env add NEXT_PUBLIC_API_URL

# When prompted, enter:
https://YOUR_USERNAME-portfolio-monitoring-backend.hf.space

# Select all environments (Production, Preview, Development)
```

### 2.5 Redeploy with Environment Variable

```powershell
vercel --prod
```

---

## ✅ Done! Your Site is Live

Your frontend will be at:
```
https://portfolio-monitoring-frontend.vercel.app
```

Or a custom URL like:
```
https://portfolio-monitoring-frontend-abc123.vercel.app
```

---

## Quick Test

1. Open your Vercel URL
2. Navigate to "Portfolio" page
3. Upload the `sample_portfolio.csv`
4. Click "Run Analysis"
5. View results in other tabs!

---

## Troubleshooting

### "CORS Error" in browser console?

Update `backend/api.py` line with your Vercel URL:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://portfolio-monitoring-frontend.vercel.app",
        "https://portfolio-monitoring-frontend-*.vercel.app",  # Preview deployments
        "http://localhost:3000"  # Local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then push to HuggingFace again:
```powershell
git add backend/api.py
git commit -m "Update CORS for Vercel"
git push hf main
```

### Backend not responding?

- Check HuggingFace Space logs
- Verify environment variables are set
- Ensure Docker build completed successfully

### Frontend can't connect to backend?

- Check NEXT_PUBLIC_API_URL in Vercel dashboard
- Make sure it's the HuggingFace Space URL (not localhost)
- Redeploy after setting: `vercel --prod`

---

## 🎉 Success!

Your portfolio monitoring agent is now live on the internet!

- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-space.hf.space
- **API Docs**: https://your-space.hf.space/docs

Share the Vercel URL with anyone! 🚀
