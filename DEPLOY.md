# Deployment Guide
> **No credit card required** — uses Neon (free Postgres) + Render (free Web Service) + Vercel (free frontend)

---

## Step 1: Create Free PostgreSQL on Neon

1. Go to [neon.tech](https://neon.tech) → **Sign up with GitHub** (no card needed)
2. Click **Create a Project** → name it `paisa` → click Create
3. On the dashboard, go to **Connection Details**
4. Set connection type to **Pooled connection** and copy the connection string:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. **Save this URL** — you'll use it as `DATABASE_URL` on Render

---

## Step 2: Deploy Backend on Render (Web Service)

> ⚠️ Use **Web Service**, NOT Blueprint (Blueprint requires a card for its managed Postgres)

1. Go to [render.com](https://render.com) → sign in → **`+ New → Web Service`**
2. Connect GitHub → select repo `de1sh0/ctrlf`
3. Configure:
   | Field | Value |
   |---|---|
   | **Root Directory** | `backend` |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
   | **Instance Type** | `Free` |

4. Scroll to **Environment Variables** and add all of these:

   | Key | Value |
   |---|---|
   | `PYTHON_VERSION` | `3.12.8` |
   | `DATABASE_URL` | Neon connection string from Step 1 |
   | `SECRET_KEY` | Any random 32-char string (e.g. generate at [randomkeygen.com](https://randomkeygen.com)) |
   | `ALGORITHM` | `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` |
   | `FRONTEND_URL` | _(leave blank for now — fill after Step 3)_ |
   | `BACKEND_URL` | _(leave blank for now — Render gives this URL after deploy)_ |
   | `GOOGLE_CLIENT_ID` | `239877382216-lmbgcunbajuk4j2litt0ljej01nmn88g.apps.googleusercontent.com` |
   | `GOOGLE_CLIENT_SECRET` | _(your Google client secret from Cloud Console)_ |
   | `GROQ_API_KEY` | _(your Groq API key)_ |
   | `SMTP_USERNAME` | _(your Gmail address)_ |
   | `SMTP_PASSWORD` | _(your 16-char Gmail App Password)_ |

5. Click **Create Web Service** → wait for deploy to finish
6. Your backend URL will be: `https://paisa-backend.onrender.com` (or similar) — **copy it**

---

## Step 3: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → sign in → **New Project**
2. Import `de1sh0/ctrlf` from GitHub
3. Set **Root Directory** to `frontend`
4. Add **Environment Variable**:
   - `VITE_API_URL` = `https://paisa-backend.onrender.com` _(your Render URL from Step 2)_
5. Click **Deploy**
6. Your frontend URL will be: `https://paisa-xyz.vercel.app` — **copy it**

---

## Step 4: Update Render with Final URLs

Go back to Render → **paisa-backend → Environment** → update:
- `FRONTEND_URL` = `https://paisa-xyz.vercel.app`
- `BACKEND_URL` = `https://paisa-backend.onrender.com`

Then click **Manual Deploy → Deploy latest commit**.

---

## Step 5: Update Google Cloud Console (CRITICAL for Gmail OAuth)

Without this, Gmail Connect will silently fail in production.

### 5a — Add Production Redirect URI
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → project **paisa-493719**
2. **APIs & Services → Credentials → Web client 1**
3. Under **Authorised redirect URIs** → **+ Add URI**:
   ```
   https://paisa-backend.onrender.com/api/gmail/callback
   ```
4. Under **Authorised JavaScript origins** → **+ Add URI**:
   ```
   https://paisa-xyz.vercel.app
   ```
5. Click **Save** (takes a few minutes to propagate)

### 5b — Add Test Users (app is in Testing mode)
Your app allows **max 100 test users**. Every Gmail account that needs to use Gmail Sync must be added:
1. **APIs & Services → OAuth consent screen → Audience**
2. **Test users → + Add users** → enter the Gmail address

---

## Step 6: Gmail App Password for SMTP

To send OTP codes, welcome emails, and budget alerts:
1. Google Account → **Security** → enable **2-Step Verification**
2. **App Passwords** → create one for "Mail"
3. Use the 16-character password as `SMTP_PASSWORD` in Render

---

## Step 7: Initialize the Database

After the first Render deploy, the tables need to be created. The app does this automatically on startup via `Base.metadata.create_all()` in `main.py` — so no extra step needed. ✅

---

## Step 8: Test the Full Flow

1. Open your Vercel URL
2. **Sign up** → receive 6-digit OTP email
3. Enter OTP → welcome email sent, logged in
4. Go to **Gmail Sync** → add bank alert emails → click **Connect Gmail**
5. Go to **Budgets** → set monthly budget → email alerts activate

---

## Quick Reference: All URLs

| Item | URL |
|---|---|
| Frontend (Vercel) | `https://paisa-xyz.vercel.app` |
| Backend API (Render) | `https://paisa-backend.onrender.com` |
| Database (Neon) | _(internal connection string)_ |
| GitHub Repo | `https://github.com/de1sh0/ctrlf` |
| Google Cloud Console | `https://console.cloud.google.com/?project=paisa-493719` |
