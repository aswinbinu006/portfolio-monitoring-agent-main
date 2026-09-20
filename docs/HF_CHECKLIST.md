# ✅ Hugging Face Deployment Checklist

## Before You Start

- [ ] Have a Hugging Face account (https://huggingface.co/join)
- [ ] Have your API keys ready:
  - [ ] Google/Gemini API key
  - [ ] Groq API key
  - [ ] Tavily API key
  - [ ] Marketaux API key

## Deployment Steps

### 1. Create Your Space
- [ ] Go to https://huggingface.co/new-space
- [ ] Name: `portfolio-monitoring-agent`
- [ ] SDK: **Gradio** (important!)
- [ ] Hardware: CPU basic (free)
- [ ] Click "Create Space"

### 2. Upload Files

**Required files to upload:**
- [ ] `app.py`
- [ ] `config.py`
- [ ] `requirements-core.txt`
- [ ] `.gitignore`
- [ ] `README_FOR_HF.md` (rename to `README.md` after upload)

**Required folders:**
- [ ] `agents/` (all files)
- [ ] `core/` (all files)
- [ ] `data/` (all files)
- [ ] `memory/` (all files)
- [ ] `tools/` (all files)
- [ ] `guardrails/` (all files)

**Optional:**
- [ ] `sample_portfolio.csv` (for testing)

### 3. Rename README
- [ ] After uploading `README_FOR_HF.md`, rename it to `README.md`
- [ ] This makes it display on your Space homepage

### 4. Add API Keys (Secrets)
Go to Settings → Variables and secrets → New secret

- [ ] Name: `GOOGLE_API_KEY`, Value: [your key], Type: Secret ✓
- [ ] Name: `GROQ_API_KEY`, Value: [your key], Type: Secret ✓
- [ ] Name: `TAVILY_API_KEY`, Value: [your key], Type: Secret ✓
- [ ] Name: `MARKETAUX_API_KEY`, Value: [your key], Type: Secret ✓

### 5. Wait for Build
- [ ] Check the "Logs" tab
- [ ] Wait 2-5 minutes
- [ ] Look for "Running on local URL: http://0.0.0.0:7860"

### 6. Test Your App
- [ ] Open your Space URL
- [ ] Upload `sample_portfolio.csv`
- [ ] Click "Run Analysis"
- [ ] Check all tabs work

### 7. Make It Public (Optional)
- [ ] Settings → Visibility → Public
- [ ] Add tags: portfolio, finance, ai-agent
- [ ] Share your link!

## Your Space URL
```
https://huggingface.co/spaces/YOUR_USERNAME/portfolio-monitoring-agent
```

## If Something Goes Wrong

### Build fails?
1. Check Logs tab for errors
2. Verify `requirements-core.txt` exists
3. Try Factory Reboot (Settings)

### App won't start?
1. Check if all folders uploaded
2. Verify API keys are added as Secrets
3. Look for Python errors in Logs

### Slow performance?
1. Settings → Space hardware
2. Upgrade to CPU upgrade or T4 GPU
3. Note: Upgrades cost money (starts at $0.03/hr)

## Quick Commands for Git Upload

If you prefer Git over web upload:

```powershell
cd "c:\Users\jayes\OneDrive\Desktop\flexi miniproject\portfolio_agent"
git init
git add .
git commit -m "Deploy to Hugging Face Spaces"
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/portfolio-monitoring-agent
git push hf main
```

## Done! 🎉

Your AI agent is now live on the internet!

**Next steps:**
- Share the link on social media
- Add it to your portfolio
- Monitor usage in Settings → Analytics
