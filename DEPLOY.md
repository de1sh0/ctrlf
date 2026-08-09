# Deployment Guide

## Step 1: Deploy Backend to Render

1. Push your code to GitHub (already done ✅).
2. Go to [render.com](https://render.com) and sign in.
3. Click **New → Blueprint** and connect your GitHub repo (`de1sh0/ctrlf`).
4. Render detects `render.yaml` and creates the Web Service + PostgreSQL DB automatically.
5. After the first deploy completes, note your backend URL — it'll be something like:
   `https://paisa-backend.onrender.com`

---

## Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **New Project** → Import `de1sh0/ctrlf`.
3. Set **Root Directory** to `frontend`.
4. Add an **Environment Variable**:
   - `VITE_API_URL` = `https://paisa-backend.onrender.com` (your Render backend URL from Step 1)
5. Click **Deploy**.
6. Note your frontend URL — e.g. `https://paisa-xyz.vercel.app`

---

## Step 3: Fill in Render Environment Variables

In the Render dashboard → **paisa-backend** → **Environment**, set:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://paisa-xyz.vercel.app` |
| `BACKEND_URL` | `https://paisa-backend.onrender.com` |
| `GOOGLE_CLIENT_ID` | `239877382216-lmbgcunbajuk4j2litt0ljej01nmn88g.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | _(from Google Cloud Console — Client Secrets section)_ |
| `SMTP_USERNAME` | your Gmail address |
| `SMTP_PASSWORD` | your 16-char Gmail App Password |
| `GROQ_API_KEY` | your Groq API key |

Then **Manual Deploy → Deploy latest commit** to apply.

---

## Step 4: Update Google Cloud Console (CRITICAL for Gmail OAuth)

This is the most important step. Without this, Gmail Connect will fail in production.

### 4a — Add the Production Redirect URI
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → project **paisa-493719**
2. Navigate to **APIs & Services → Credentials → Web client 1**
3. Under **Authorised redirect URIs**, click **+ Add URI** and add:
   ```
   https://paisa-backend.onrender.com/api/gmail/callback
   ```
4. Under **Authorised JavaScript origins**, click **+ Add URI** and add:
   ```
   https://paisa-xyz.vercel.app
   ```
5. Click **Save**.

### 4b — Add Test Users (while app is in Testing mode)
Your app is in **Testing** mode with a 100-user cap. Every user who wants to connect Gmail must be added as a test user.

1. Go to **APIs & Services → OAuth consent screen → Audience**
2. Scroll to **Test users → + Add users**
3. Add the Gmail address of each user who needs to use Gmail Sync.

### 4c — (Optional) Publish the App
To allow any Google user (not just test users) to connect Gmail:
1. Click **Publish app** on the Audience page.
2. This requires Google's verification process for sensitive scopes (Gmail readonly).
3. For now, staying in **Testing** mode with added test users is the easiest path.

---

## Step 5: Gmail App Password for SMTP

To send MFA codes, welcome emails, and budget alerts:
1. Go to your Google Account → **Security**
2. Enable **2-Step Verification**
3. Go to **App Passwords** → create one for "Mail"
4. Use the 16-character password as `SMTP_PASSWORD` in Render.

---

## Step 6: Test the Full Flow

1. Open your Vercel URL.
2. Sign up → receive 6-digit OTP in email.
3. Enter OTP → welcome email sent, logged in.
4. Go to **Gmail Sync** → add your bank alert email addresses → click Connect Gmail.
5. Go to **Budgets** → set monthly budget to enable email alerts.
