# 🚀 Deploy Backend to Render

Render is an excellent platform for deploying the FastAPI backend. You can deploy it using either the **Python Native Web Service** or **Docker**.

---

## Method 1: Web Service (Fastest & Simplest)

1. Sign in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub / GitLab repository containing this project.
4. Fill in the settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `portfolio-monitoring-backend` |
| **Language / Runtime** | `Python 3` |
| **Root Directory** | `backend` |
| **Branch** | `main` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn api:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` (or Starter) |

5. Under **Environment Variables**, click **Add Environment Variable** for:
   - `GOOGLE_API_KEY`: Your Gemini API key
   - `GROQ_API_KEY`: Your Groq API key
   - `TAVILY_API_KEY`: Your Tavily Search key
   - `MARKETAUX_API_KEY`: Your Marketaux key
   - `CORS_ORIGINS`: `*` (or your Vercel frontend URL, e.g. `https://your-frontend.vercel.app`)
   - `PYTHON_VERSION`: `3.11.9`
6. Click **Create Web Service**.

Once deployed, Render gives you a URL like:
```
https://portfolio-monitoring-backend.onrender.com
```

- Verify health check: `https://portfolio-monitoring-backend.onrender.com/`
- Interactive API Docs: `https://portfolio-monitoring-backend.onrender.com/docs`

---

## Method 2: Docker Web Service

If you prefer deploying via Docker on Render:
1. Click **New +** → **Web Service**.
2. Connect your repository.
3. Select **Docker** as the runtime.
4. Set **Root Directory** to `backend`.
5. Render will automatically detect `backend/Dockerfile`.
6. Add your environment variables (`GOOGLE_API_KEY`, `GROQ_API_KEY`, etc.).
7. Click **Create Web Service**.

---

## Step 2: Connect Frontend to Render Backend

Once your backend is live on Render:
1. Go to your frontend hosting provider (e.g. **Vercel**).
2. Go to **Settings** → **Environment Variables**.
3. Set:
   ```
   NEXT_PUBLIC_API_URL=https://portfolio-monitoring-backend.onrender.com
   ```
4. Redeploy your frontend in Vercel.
5. In Render, set `CORS_ORIGINS` to your Vercel URL (e.g., `https://your-app.vercel.app,http://localhost:3000`).

---

## Note on Render Free Tier Spin-Down
Render's free tier spins down after 15 minutes of inactivity. When a new request arrives from the frontend, it may take ~30-50 seconds to wake up (cold start). The frontend has a 3-minute timeout configured in [`frontend/lib/api.ts`](file:///frontend/lib/api.ts) to gracefully handle cold starts.
