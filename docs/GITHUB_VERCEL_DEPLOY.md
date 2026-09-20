# 🚀 Deploy to GitHub + Vercel - Complete Guide

## Overview

We'll deploy:
1. **Backend** → HuggingFace Docker Space (handles all processing)
2. **Frontend** → Vercel (connected to GitHub)

This way, code updates automatically deploy when you push to GitHub!

---

## Part 1: Push to GitHub (5 minutes)

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Fill in:
   - **Repository name**: `portfolio-monitoring-agent`
   - **Description**: `AI-powered portfolio monitoring with FastAPI + Next.js`
   - **Visibility**: Public or Private (your choice)
   - **DO NOT** initialize with README (we already have one)
3. Click "Create repository"

### Step 2: Initialize Git and Push

```powershell
# Navigate to project
cd "c:\Users\jayes\OneDrive\Desktop\flexi miniproject\portfolio_agent"

# Initialize git
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: FastAPI backend + Next.js frontend"

# Add GitHub remote (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/portfolio-monitoring-agent.git

# Push to GitHub
git push -u origin main
```

If it asks for credentials:
- Use your GitHub username
- For password, use a **Personal Access Token** from https://github.com/settings/tokens

✅ **Code is now on GitHub!**

---

## Part 2: Deploy Backend to HuggingFace (5 minutes)

### Step 1: Create HuggingFace Space

1. Go to https://huggingface.co/new-space
2. Fill in:
   - **Space name**: `portfolio-monitoring-backend`
   - **SDK**: **Docker** (important!)
   - **Space hardware**: CPU basic (free)
   - **Visibility**: Public
3. Click "Create Space"

### Step 2: Push Backend Code

```powershell
# Still in the same directory
cd "c:\Users\jayes\OneDrive\Desktop\flexi miniproject\portfolio_agent"

# Add HuggingFace remote (replace YOUR_USERNAME)
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/portfolio-monitoring-backend

# Push to HuggingFace
git push hf main
```

### Step 3: Set Environment Variables

In HuggingFace Space → ⚙️ Settings → Variables and secrets:

Click "New secret" for each:

| Name | Value (from your .env file) | Secret? |
|------|------------------------------|---------|
| `GOOGLE_API_KEY` | [Your key] | ✓ |
| `GROQ_API_KEY` | [Your key] | ✓ |
| `TAVILY_API_KEY` | [Your key] | ✓ |
| `MARKETAUX_API_KEY` | [Your key] | ✓ |
| `HF_TOKEN` | [Your key] | ✓ |

### Step 4: Wait for Build

- Check the "Logs" tab
- Wait 2-5 minutes for Docker build
- Once complete, your backend URL will be:
  ```
  https://YOUR_USERNAME-portfolio-monitoring-backend.hf.space
  ```

**Test it**: Visit the URL and add `/docs` to see the API documentation!

✅ **Backend is live!**

---

## Part 3: Deploy Frontend to Vercel (3 minutes)

### Step 1: Connect Vercel to GitHub

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select "GitHub" and authenticate
4. Find and select your `portfolio-monitoring-agent` repository

### Step 2: Configure Project

In the import screen:

**Framework Preset**: Next.js (should auto-detect)

**Root Directory**: Click "Edit" → Select `frontend`

**Build Settings**:
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)
- Install Command: `npm install` (default)

**Environment Variables** - Add one:
- Name: `NEXT_PUBLIC_API_URL`
- Value: `https://YOUR_USERNAME-portfolio-monitoring-backend.hf.space`
  (Replace with YOUR actual HuggingFace Space URL)

### Step 3: Deploy

Click "Deploy"

Vercel will:
1. Clone your GitHub repo
2. Build the Next.js frontend
3. Deploy it

This takes 1-2 minutes.

✅ **Frontend is live!**

Your site will be at:
```
https://portfolio-monitoring-agent.vercel.app
```

Or similar (Vercel shows you the exact URL).

---

## Part 4: Update CORS (Important!)

Now that you have your Vercel URL, update the backend CORS:

### Edit backend/api.py

Change line 67 from:

```python
allow_origins=["*"],  # Change to your Vercel URL
```

To:

```python
allow_origins=[
    "https://portfolio-monitoring-agent.vercel.app",  # Your actual Vercel URL
    "https://*.vercel.app",  # All Vercel preview deployments
    "http://localhost:3000"  # Local development
],
```

### Push the update:

```powershell
# Commit the change
git add backend/api.py
git commit -m "Update CORS for production Vercel URL"

# Push to both GitHub and HuggingFace
git push origin main
git push hf main
```

✅ **CORS configured!**

---

## 🎉 You're Live!

Your portfolio monitoring agent is now deployed:

- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-space.hf.space
- **API Docs**: https://your-space.hf.space/docs
- **GitHub**: https://github.com/YOUR_USERNAME/portfolio-monitoring-agent

### Test it:

1. Open your Vercel URL
2. Go to "Portfolio" page
3. Upload `sample_portfolio.csv`
4. Click "Run Analysis"
5. View results! 🚀

---

## Future Updates

From now on, to update your live site:

```powershell
# Make your changes, then:
git add .
git commit -m "Your update message"
git push origin main  # Triggers Vercel rebuild automatically
git push hf main      # Updates backend
```

**Vercel automatically rebuilds** when you push to GitHub! 🎉

---

## Troubleshooting

### Can't push to GitHub?

**Error: "remote: Support for password authentication was removed"**

Solution: Use a Personal Access Token instead of password
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `workflow`
4. Copy the token
5. Use it as your password when pushing

### Backend build fails on HuggingFace?

- Check the "Logs" tab for errors
- Verify Dockerfile is in the root directory
- Ensure requirements-core.txt exists
- Try "Factory reboot" in Settings

### Frontend can't connect to backend?

- Verify `NEXT_PUBLIC_API_URL` in Vercel dashboard
- Make sure it's your HuggingFace Space URL
- Check CORS settings in backend/api.py
- Redeploy: Settings → Deployments → Redeploy

### CORS errors?

- Update backend/api.py with your Vercel URL
- Push to HuggingFace: `git push hf main`
- Wait for rebuild (1-2 minutes)

---

## Quick Reference

| Service | URL | Purpose |
|---------|-----|---------|
| GitHub | github.com/YOUR_USERNAME/portfolio-monitoring-agent | Code repository |
| HuggingFace | YOUR_USERNAME-portfolio-monitoring-backend.hf.space | Backend API |
| Vercel | portfolio-monitoring-agent.vercel.app | Frontend UI |

---

## Cost

Everything is **FREE**:
- ✅ GitHub: Free for public/private repos
- ✅ HuggingFace: Free Docker Space (CPU basic)
- ✅ Vercel: Free for hobby projects

---

## Need Help?

Check these files:
- `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- `DEPLOY_NOW.md` - Quick deployment guide
- `README.md` - Project overview

Or open an issue on GitHub! 🙌
