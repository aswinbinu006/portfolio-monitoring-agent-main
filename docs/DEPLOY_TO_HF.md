# Deploy to Hugging Face Spaces - Step by Step

## 🚀 Quick Start (5 minutes)

### Step 1: Create Hugging Face Account
1. Go to https://huggingface.co/join
2. Sign up with email or GitHub
3. Verify your email

### Step 2: Create a New Space
1. Go to https://huggingface.co/new-space
2. Fill in the form:
   - **Owner**: Your username
   - **Space name**: `portfolio-monitoring-agent`
   - **License**: MIT
   - **Select the SDK**: **Gradio** ⚠️ Important!
   - **Space hardware**: CPU basic (free)
   - **Visibility**: Public (or Private if you prefer)
3. Click **Create Space**

### Step 3: Upload Your Code

**Option A: Web Upload (Easiest)**
1. In your new Space, click the **"Files"** tab
2. Click **"Add file"** → **"Upload files"**
3. Upload these files from `c:\Users\jayes\OneDrive\Desktop\flexi miniproject\portfolio_agent\`:
   - `app.py`
   - `config.py`
   - `requirements-core.txt`
   - `.gitignore`
   - Entire `agents/` folder
   - Entire `core/` folder
   - Entire `data/` folder
   - Entire `memory/` folder
   - Entire `tools/` folder
   - Entire `guardrails/` folder
   - `sample_portfolio.csv` (optional)
4. Click **"Commit changes to main"**

**Option B: Git Push (Recommended)**
Open PowerShell and run:

```powershell
cd "c:\Users\jayes\OneDrive\Desktop\flexi miniproject\portfolio_agent"

# Initialize git
git init

# Add files
git add .

# Commit
git commit -m "Initial deployment to Hugging Face Spaces"

# Add remote (replace YOUR_USERNAME with your HF username)
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/portfolio-monitoring-agent

# Push to HF
git push hf main
```

If asked for credentials:
- Username: Your HF username
- Password: Use a **token** from https://huggingface.co/settings/tokens

### Step 4: Add Environment Variables (API Keys)

1. In your Space, click **⚙️ Settings**
2. Scroll to **"Variables and secrets"**
3. Click **"New secret"**
4. Add each API key:

| Name | Value | Type |
|------|-------|------|
| `GOOGLE_API_KEY` | Your Gemini API key | Secret ✓ |
| `GROQ_API_KEY` | Your Groq API key | Secret ✓ |
| `TAVILY_API_KEY` | Your Tavily API key | Secret ✓ |
| `MARKETAUX_API_KEY` | Your Marketaux key | Secret ✓ |
| `HF_TOKEN` | Your HF token (optional) | Secret ✓ |

5. Click **"Save"** after each one

### Step 5: Wait for Build

The Space will automatically:
1. Install dependencies from `requirements-core.txt`
2. Start your Gradio app
3. Show you the build logs

This takes **2-5 minutes**.

### Step 6: Your App is Live! 🎉

Access your app at:
```
https://huggingface.co/spaces/YOUR_USERNAME/portfolio-monitoring-agent
```

Share this link with anyone!

---

## 📊 Your App Will Have:

✅ Portfolio upload interface
✅ Real-time risk analysis
✅ Anomaly detection with news
✅ ML volatility forecasting
✅ Interactive charts
✅ Investment briefings

---

## 🔧 Troubleshooting

### Build fails?
- Check build logs in your Space
- Make sure `requirements-core.txt` exists
- Verify all folders were uploaded

### "Module not found" error?
- Check if all Python packages are in `requirements-core.txt`
- Rebuild the Space (Settings → Factory reboot)

### API keys not working?
- Make sure they're added as **Secrets** (not regular variables)
- Restart the Space after adding secrets
- Check keys don't have extra spaces

### App is slow?
**Upgrade hardware:**
1. Go to Settings
2. Change "Space hardware"
3. Options:
   - CPU basic: FREE (slower)
   - CPU upgrade: $0.03/hour (faster)
   - T4 GPU: $0.60/hour (fastest for ML)

---

## 💡 Pro Tips

### Make Your Space Stand Out
1. Add a **README.md** with:
   - Description of your agent
   - How to use it
   - Example portfolios
2. Add a **thumbnail.png** (preview image)
3. Tag it: portfolio, finance, monitoring, ML

### Enable Discussions
Settings → Enable discussions (so users can ask questions)

### Monitor Usage
Settings → Analytics (see how many people use it)

### Add Example Files
Upload sample CSVs so users can test immediately

---

## 📝 Next Steps After Deployment

1. **Test your app** with sample portfolio
2. **Share the link** on LinkedIn/Twitter
3. **Monitor logs** for any errors
4. **Upgrade hardware** if needed for production use

---

## 🆘 Need Help?

- HF Spaces Docs: https://huggingface.co/docs/hub/spaces
- HF Discord: https://discord.gg/hugging-face
- Community Forum: https://discuss.huggingface.co/

Your deployment is ready! Follow these steps and your AI agent will be live on the internet in 5 minutes! 🚀
