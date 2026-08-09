# Deployment Guide

## Step 1: Deploy Backend to Render

1. Push your code to GitHub (if not already).
2. Go to [render.com](https://render.com) and sign in.
3. Click **New → Blueprint** and connect your GitHub repo.
4. Render will detect the `render.yaml` and auto-create the Web Service and PostgreSQL DB.
5. After the first deploy, go to the **paisa-backend** service → **Environment**:
   - Set `FRONTEND_URL` → your Vercel URL (you'll get this in Step 2)
   - Set `GROQ_API_KEY` → your Groq API key
   - Set `SMTP_USERNAME` → your Gmail address (e.g. `your@gmail.com`)
   - Set `SMTP_PASSWORD` → a Gmail **App Password** (see below)
6. Your backend URL will be something like `https://paisa-backend.onrender.com`

### How to get a Gmail App Password (for SMTP)
1. Go to your Google Account → Security
2. Enable **2-Step Verification**
3. Then go to **App Passwords** → create one for "Mail"
4. Use that 16-character password as `SMTP_PASSWORD`

---

## Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **New Project** → Import your GitHub repo.
3. Set **Root Directory** to `frontend`.
4. Add an **Environment Variable**:
   - `VITE_API_URL` = `https://paisa-backend.onrender.com` (your Render backend URL)
5. Click **Deploy**.
6. Your frontend URL will be something like `https://paisa-xyz.vercel.app`

---

## Step 3: Connect Frontend & Backend

1. In Render, update `FRONTEND_URL` to your Vercel URL.
2. In the backend CORS (`main.py`), you can also hardcode your Vercel URL.
3. Redeploy the backend.

---

## Step 4: Test the Full Flow

1. Open your Vercel URL.
2. Sign up → You'll receive a 6-digit OTP in your email.
3. Enter the OTP → Welcome email sent.
4. Go to **Gmail Sync** → Add your bank alert email addresses.
5. Go to **Budgets** → Set monthly budget to enable email alerts.
