# Ctrl F — Project Setup Guide

A step-by-step guide to setting up the **Ctrl F** Smart Expense Tracker on a new Mac from scratch.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Homebrew | latest | Mac package manager |
| Node.js | 18+ | Frontend runtime |
| Python | 3.12 | Backend runtime |
| PostgreSQL | 16 | Database |

---

## Step 1: Install Homebrew

If Homebrew is not already installed, run this in Terminal:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

## Step 2: Install Prerequisites

```bash
brew install node@18
brew install python@3.12
brew install postgresql@16
```

---

## Step 3: Setup PostgreSQL Database

Start the PostgreSQL service and create the database:

```bash
brew services start postgresql@16
createdb paisa_db
```

> [!NOTE]
> The database name `paisa_db` must match the `DATABASE_URL` value in your `.env` file.

---

## Step 4: Clone the Repository

```bash
git clone https://github.com/de1sh0/ctrlf.git
cd ctrlf
```

---

## Step 5: Backend Setup

### 5.1 — Create Virtual Environment

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
```

### 5.2 — Install Dependencies

```bash
pip install -r requirements.txt
```

### 5.3 — Download NLP Model

The app uses spaCy for parsing bank emails:

```bash
python -m spacy download en_core_web_sm
```

### 5.4 — Configure Environment Variables

Create a `.env` file inside the `backend/` folder:

```bash
touch backend/.env
```

Paste the following into `backend/.env` and fill in your values:

```env
DATABASE_URL=postgresql://localhost/paisa_db
SECRET_KEY=your-super-secret-key-change-this-in-production-32chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
FRONTEND_URL=http://localhost:8080
```

> [!IMPORTANT]
> Change `SECRET_KEY` to a long, random string in production. Never commit this file to Git.

### 5.5 — Add Google OAuth Credentials

The Gmail sync feature requires a `credentials.json` file from Google Cloud Console.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use an existing one)
3. Enable the **Gmail API**
4. Go to **APIs & Services → Credentials**
5. Create **OAuth 2.0 Client ID** (Web Application type)
6. Add `http://localhost:8000` as an Authorized origin
7. Add `http://localhost:8000/api/gmail/callback` as an Authorized Redirect URI
8. Download the JSON file and save it as `backend/credentials.json`

> [!TIP]
> If you already have a working `credentials.json` from another machine, you can simply copy it over — no need to create a new one.

### 5.6 — Run Database Migrations

```bash
# Make sure venv is active and you're in the backend/ folder
cd backend
source venv/bin/activate
alembic upgrade head
```

### 5.7 — Start the Backend Server

```bash
export OAUTHLIB_INSECURE_TRANSPORT=1
uvicorn app.main:app --reload --port 8000
```

The backend API is now live at **http://localhost:8000**

You can view the auto-generated API docs at **http://localhost:8000/docs**

---

## Step 6: Frontend Setup

Open a **new** Terminal window (keep the backend running in the first one).

```bash
cd frontend
npm install
npm run dev
```

The frontend is now live at **http://localhost:8080**

---

## Step 7: First-Time App Setup

1. Open your browser and navigate to **http://localhost:8080**
2. Click **Sign Up** to create a new account
3. Log in with your credentials
4. On the Overview dashboard, click **Connect Gmail**
5. Authorize with your Google account
6. Click **Sync Gmail** — transactions from the 1st of the current month will be automatically fetched and categorized!

---

## Project Structure

```
ctrlf/
├── backend/
│   ├── app/
│   │   ├── models/         # SQLAlchemy DB models
│   │   ├── routes/         # FastAPI route handlers
│   │   ├── services/       # Business logic (gmail, nlp, auth)
│   │   └── main.py         # App entry point
│   ├── credentials.json    # ⚠️ Google OAuth (never commit!)
│   ├── .env                # ⚠️ Environment variables (never commit!)
│   └── requirements.txt    # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page-level components
│   │   └── lib/            # API client & utilities
│   └── package.json        # Node.js dependencies
│
├── requirements.txt        # Root-level Python requirements (mirror)
├── .gitignore
└── SETUP.md                # This file
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query |
| Backend | FastAPI (Python 3.12) |
| ORM | SQLAlchemy + Alembic |
| Database | PostgreSQL |
| Auth | JWT (python-jose) |
| NLP | spaCy + scikit-learn TF-IDF |
| Gmail | Google API Python Client |
| Scheduler | APScheduler (syncs every 5 min) |

---

## Common Issues & Fixes

### `createdb: command not found`
Add PostgreSQL to your PATH:
```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### `OAUTHLIB_INSECURE_TRANSPORT` error
Always export this env variable before starting the backend locally:
```bash
export OAUTHLIB_INSECURE_TRANSPORT=1
```

### `spacy model not found`
Re-download the model with the venv activated:
```bash
source venv/bin/activate
python -m spacy download en_core_web_sm
```

### Gmail OAuth redirect fails
Make sure `http://localhost:8000/api/gmail/callback` is in your Google Cloud Console Authorized Redirect URIs.

---

## Migrating Data from Another Machine

To move your existing transaction data to the new Mac:

**On the old Mac (export):**
```bash
pg_dump paisa_db > paisa_db_backup.sql
```

**On the new Mac (import, after Step 3):**
```bash
psql paisa_db < paisa_db_backup.sql
```

---

*Last updated: July 2026*
