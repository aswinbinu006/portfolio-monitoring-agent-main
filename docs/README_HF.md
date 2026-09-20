# Portfolio Monitoring Agent - Hugging Face Spaces Setup

## Quick Deploy to Hugging Face Spaces

### 1. Create a Hugging Face Account
- Go to https://huggingface.co/join
- Verify your email

### 2. Create a New Space
- Go to https://huggingface.co/new-space
- Fill in:
  - **Space name**: `portfolio-monitoring-agent` (or your choice)
  - **License**: MIT
  - **Select the SDK**: Gradio
  - **Space hardware**: CPU basic (free) - can upgrade later
  - **Visibility**: Public or Private

### 3. Push Your Code

#### Option A: Upload Files (Easiest)
1. After creating the Space, click "Files" tab
2. Click "Add file" > "Upload files"
3. Upload all files from the `portfolio_agent` folder
4. Click "Commit changes to main"

#### Option B: Git Push (Recommended)
```bash
# Navigate to your project
cd "c:\Users\jayes\OneDrive\Desktop\flexi miniproject\portfolio_agent"

# Initialize git if not already
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Portfolio Monitoring Agent"

# Add HF remote (replace YOUR_USERNAME and YOUR_SPACE_NAME)
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME

# Push
git push hf main
```

### 4. Configure Environment Variables

In your Space settings (⚙️ Settings > Variables and secrets):

**Required:**
- `GOOGLE_API_KEY` - Your Google/Gemini API key
- `GROQ_API_KEY` - Your Groq API key
- `TAVILY_API_KEY` - Your Tavily API key
- `MARKETAUX_API_KEY` - Your Marketaux API key

**Optional:**
- `HF_TOKEN` - Your Hugging Face token (for private models)

### 5. Modify app.py for HF Spaces

The app is already configured, but ensure the launch parameters are correct:

```python
# At the end of app.py, make sure it's:
app.launch(
    server_name="0.0.0.0",
    server_port=7860,
    share=False  # HF handles sharing
)
```

### 6. Wait for Build

HF Spaces will:
1. Install dependencies from `requirements-core.txt`
2. Start your app automatically
3. Show build logs

### 7. Access Your App

Your app will be live at:
```
https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
```

## Troubleshooting

### Build fails?
- Check the logs in the Space
- Ensure `requirements-core.txt` has all dependencies
- Make sure app.py is in root directory

### Timeout errors?
- Upgrade to better hardware (Settings > Hardware)
- CPU basic is free but slower
- T4 GPU is $0.60/hour (much faster for ML models)

### Environment variables not loading?
- Double-check variable names in Settings
- Restart the Space after adding variables

## Performance Tips

1. **Upgrade Hardware**: For production, use T4 GPU or better
2. **Add Caching**: The system already caches API responses
3. **Monitor Usage**: Check Space analytics in settings
4. **Set Secrets**: Use the "Secret" toggle for API keys

## Cost Estimate

- **CPU Basic**: FREE (may be slow for large portfolios)
- **CPU Upgrade**: ~$0.03/hour
- **T4 GPU**: ~$0.60/hour (recommended for production)

## Need Help?

- HF Spaces Docs: https://huggingface.co/docs/hub/spaces
- Community Forum: https://discuss.huggingface.co/
- Discord: https://discord.gg/hugging-face
