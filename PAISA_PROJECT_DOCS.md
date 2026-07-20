# Paisa — Smart Expense Tracker
## Complete Project Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Architecture Overview](#4-architecture-overview)
5. [Frontend — React + Vite](#5-frontend--react--vite)
6. [Backend — FastAPI](#6-backend--fastapi)
7. [Database — PostgreSQL](#7-database--postgresql)
8. [Gmail Sync Pipeline](#8-gmail-sync-pipeline)
9. [NLP & Category Classification](#9-nlp--category-classification)
10. [Authentication Flow](#10-authentication-flow)
11. [API Reference](#11-api-reference)
12. [Environment Variables](#12-environment-variables)
13. [Running Locally](#13-running-locally)
14. [Key Design Decisions](#14-key-design-decisions)
15. [Known Limitations & Future Work](#15-known-limitations--future-work)

---

## 1. Project Overview

**Paisa** is a full-stack personal expense tracking web application with an AI-powered Gmail sync feature. It automatically detects bank transaction emails from HDFC Bank, parses the amount and merchant using NLP, classifies the expense category using TF-IDF machine learning, and adds it to the user's dashboard — with zero manual entry.

### Core Features

| Feature | Status |
|---|---|
| User signup / login with JWT auth | ✅ Done |
| Manual expense add / edit / delete | ✅ Done |
| Monthly expense dashboard | ✅ Done |
| Budget management per category | ✅ Done |
| Category breakdown (pie chart) | ✅ Done |
| Daily spending bar chart | ✅ Done |
| Analytics page | ✅ Done |
| Gmail OAuth connect | ✅ Done |
| Auto-detect HDFC transactions from email | ✅ Done |
| NLP parsing (spaCy + TF-IDF) | ✅ Done |
| Duplicate prevention via UPI ref number | ✅ Done |
| Auto-sync every 5 minutes | ✅ Done |

---

## 2. Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v3 |
| UI components | shadcn/ui (Radix UI) |
| Charts | Recharts |
| Routing | React Router v6 |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Notifications | Sonner |
| Icons | Lucide React |

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI |
| Language | Python 3.12 |
| ORM | SQLAlchemy 2.0 |
| Database | PostgreSQL |
| Auth | JWT (python-jose) |
| Password hashing | bcrypt |
| Scheduler | APScheduler |
| NLP | spaCy (en_core_web_sm) |
| ML classifier | scikit-learn (TF-IDF + cosine similarity) |
| Gmail integration | google-api-python-client |
| OAuth | google-auth-oauthlib |

### Infrastructure (local dev)
| Service | Tool |
|---|---|
| Frontend | localhost:8080 |
| Backend | localhost:8000 |
| Database | PostgreSQL (local) |

---

## 3. Project Structure

```
paisa/
├── frontend/                          # React + Vite app
│   ├── src/
│   │   ├── App.tsx                    # Root component, routes
│   │   ├── main.tsx                   # Entry point
│   │   ├── index.css                  # Global styles + Tailwind
│   │   ├── pages/
│   │   │   ├── Index.tsx              # Dashboard (overview)
│   │   │   ├── Auth.tsx               # Login + Signup
│   │   │   ├── Transactions.tsx       # Full transaction list
│   │   │   ├── Budgets.tsx            # Budget management
│   │   │   ├── Analytics.tsx          # Charts + insights
│   │   │   ├── Categories.tsx         # Category breakdown
│   │   │   ├── Gmail.tsx              # Gmail connect + sync
│   │   │   └── NotFound.tsx           # 404 page
│   │   ├── components/
│   │   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   │   ├── Header.tsx             # Dashboard header + month nav
│   │   │   ├── StatsCards.tsx         # 4 stat cards (total, remaining, etc.)
│   │   │   ├── TopCategory.tsx        # Top spending category + auto-captured
│   │   │   ├── RecentTransactions.tsx # Transaction list with filters
│   │   │   ├── CategoryBreakdown.tsx  # Pie chart by category
│   │   │   ├── BudgetHealth.tsx       # Budget progress bars
│   │   │   ├── DailySpending.tsx      # Daily bar chart
│   │   │   ├── AddExpenseDialog.tsx   # Add expense modal
│   │   │   ├── ProtectedRoute.tsx     # Auth guard for routes
│   │   │   └── ui/                    # shadcn/ui components
│   │   ├── hooks/
│   │   │   ├── useExpenses.ts         # TanStack Query for expenses CRUD
│   │   │   └── useBudgets.ts          # TanStack Query for budgets
│   │   └── lib/
│   │       ├── api.ts                 # All API fetch functions
│   │       └── utils.ts               # Tailwind cn() helper
│   ├── .env.local                     # VITE_API_URL=http://localhost:8000
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
│
└── backend/                           # FastAPI app
    ├── app/
    │   ├── main.py                    # FastAPI entry point, CORS, routers
    │   ├── config.py                  # Settings from .env
    │   ├── database.py                # SQLAlchemy engine + session
    │   ├── api/
    │   │   ├── auth.py                # POST /signup, /login, GET /me
    │   │   ├── expenses.py            # CRUD /expenses
    │   │   ├── budgets.py             # GET/PATCH /budgets
    │   │   ├── stats.py               # GET /stats/monthly
    │   │   └── gmail.py               # OAuth connect, callback, sync
    │   ├── models/
    │   │   ├── user.py                # Users table
    │   │   ├── expense.py             # Expenses table
    │   │   ├── budget.py              # Budgets table
    │   │   └── gmail_token.py         # Gmail OAuth tokens table
    │   ├── schemas/
    │   │   ├── user.py                # Pydantic user schemas
    │   │   ├── expense.py             # Pydantic expense schemas
    │   │   └── budget.py              # Pydantic budget schemas
    │   ├── core/
    │   │   ├── security.py            # bcrypt + JWT functions
    │   │   └── deps.py                # get_current_user dependency
    │   └── services/
    │       ├── gmail_service.py       # Gmail API + email parsing
    │       ├── nlp_parser.py          # spaCy + TF-IDF classifier
    │       └── scheduler.py           # APScheduler — runs sync every 5 min
    ├── credentials.json               # Google OAuth credentials (never commit)
    ├── requirements.txt
    └── .env                           # DB URL, JWT secret
```

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    USER BROWSER                      │
│           React + Vite (localhost:8080)              │
│                                                      │
│  ┌──────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │ Dashboard│  │Transactions│  │  Gmail Settings  │  │
│  └────┬─────┘  └─────┬──────┘  └────────┬────────┘  │
│       │              │                  │            │
│       └──────────────┴──────────────────┘            │
│                    TanStack Query                    │
│              (fetch + cache + refetch)               │
└────────────────────────┬────────────────────────────┘
                         │ HTTP/JSON
                         ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI (localhost:8000)                │
│                                                      │
│  /api/auth     /api/expenses    /api/budgets         │
│  /api/stats    /api/gmail                            │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │           APScheduler (every 5 min)          │    │
│  │  sync_all_users() → Gmail API → NLP Parser   │    │
│  └─────────────────────────────────────────────┘    │
└──────────┬───────────────────────┬──────────────────┘
           │                       │
           ▼                       ▼
┌──────────────────┐    ┌──────────────────────────┐
│   PostgreSQL     │    │      Gmail API            │
│                  │    │  (Google OAuth 2.0)       │
│  users           │    │  Read-only inbox access   │
│  expenses        │    │  HDFC alert emails        │
│  budgets         │    └──────────────────────────┘
│  gmail_tokens    │
└──────────────────┘
```

---

## 5. Frontend — React + Vite

### Routing (`App.tsx`)

All routes except `/auth` are wrapped in `ProtectedRoute` which checks `localStorage` for `paisa_token`. If not found, redirects to `/auth`.

```
/          → Dashboard (Index.tsx)
/auth      → Login + Signup (Auth.tsx)
/transactions → Full transaction list
/budgets   → Budget management
/analytics → Charts + insights
/categories → Category breakdown
/gmail     → Gmail sync settings
```

### State Management

**TanStack Query** handles all server state:
- `useExpenses()` — fetches `/api/expenses`, provides `addExpense`, `deleteExpense`, `updateExpense` mutations
- `useBudgets()` — fetches `/api/budgets`, provides `updateBudget` mutation
- Both hooks call `queryClient.invalidateQueries()` on mutation success to refetch fresh data

### API Layer (`src/lib/api.ts`)

Central file with typed fetch functions. All requests include `Authorization: Bearer {token}` from localStorage. Base URL comes from `VITE_API_URL` env variable.

```typescript
// Example
const expenses = await expensesApi.getAll(month, year)
const budget   = await budgetsApi.update(id, newLimit)
const status   = await gmailApi.getStatus()
```

### Authentication

- On signup/login → FastAPI returns `{ access_token, user }`
- Token saved to `localStorage.paisa_token`
- User object saved to `localStorage.paisa_user`
- `ProtectedRoute` checks for token on every route change
- Logout clears both keys and redirects to `/auth`

---

## 6. Backend — FastAPI

### Entry Point (`main.py`)

- Creates all DB tables on startup via `Base.metadata.create_all()`
- Starts APScheduler via lifespan context manager
- Configures CORS for localhost:8080

### API Endpoints

#### Auth (`/api/auth`)
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create account, returns JWT |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

#### Expenses (`/api/expenses`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/expenses` | List expenses (filter by month/year) |
| POST | `/api/expenses` | Create expense |
| PATCH | `/api/expenses/{id}` | Update expense |
| DELETE | `/api/expenses/{id}` | Delete expense |

#### Budgets (`/api/budgets`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/budgets` | Get all budgets (auto-creates defaults) |
| PATCH | `/api/budgets/{id}` | Update budget limit |

#### Stats (`/api/stats`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/stats/monthly` | Monthly summary (total, remaining, avg) |

#### Gmail (`/api/gmail`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/gmail/connect` | Get Google OAuth URL |
| GET | `/api/gmail/callback` | OAuth callback, saves tokens |
| GET | `/api/gmail/status` | Check if Gmail connected |
| POST | `/api/gmail/sync` | Manually trigger sync |
| DELETE | `/api/gmail/disconnect` | Remove Gmail connection |

### Security

- All endpoints except `/api/auth/*` require `Authorization: Bearer {token}` header
- `get_current_user` dependency decodes JWT and loads user from DB
- Passwords hashed with bcrypt
- Each user can only access their own data (user_id filter on all queries)

---

## 7. Database — PostgreSQL

### Tables

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | VARCHAR | Full name |
| email | VARCHAR | Unique, indexed |
| hashed_password | VARCHAR | bcrypt hash |
| is_active | BOOLEAN | Default true |
| gmail_connected | BOOLEAN | Default false |
| created_at | TIMESTAMP | Auto |

#### `expenses`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → users |
| description | VARCHAR | Merchant name or description |
| amount | FLOAT | Transaction amount |
| category | VARCHAR | Food & Dining, Transport, etc. |
| emoji | VARCHAR | Category emoji |
| date | VARCHAR | YYYY-MM-DD format |
| type | ENUM | debit / credit |
| source | ENUM | manual / auto |
| upi_ref | VARCHAR | UPI reference number (unique key for dedup) |
| gmail_message_id | VARCHAR | Gmail message ID (fallback dedup) |
| created_at | TIMESTAMP | Auto |

#### `budgets`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → users |
| category | VARCHAR | Category name |
| emoji | VARCHAR | Category emoji |
| limit | FLOAT | Monthly spending limit |

Default budgets are auto-created for each user on first `/api/budgets` call:
- Food & Dining → ₹8,000
- Transport → ₹6,000
- Groceries → ₹7,000
- Shopping → ₹5,000
- Entertainment → ₹3,000
- Health → ₹3,000
- Bills & Utilities → ₹5,000
- Education → ₹5,000
- Travel → ₹10,000
- Other → ₹2,000

#### `gmail_tokens`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | Unique FK → users |
| access_token | TEXT | Google OAuth access token |
| refresh_token | TEXT | Used to refresh expired tokens |
| email | VARCHAR | Connected Gmail address |
| created_at | TIMESTAMP | Auto |

---

## 8. Gmail Sync Pipeline

### How It Works

```
GPay payment made
       ↓
HDFC Bank sends email to Gmail
"Rs.340.00 debited from a/c XX1234 to VPA 9876@ibl
 ZOMATO UPI. UPI transaction reference number is 123456789012"
       ↓
APScheduler wakes up every 5 minutes
       ↓
gmail_service.py fetches unread emails from:
  alerts@hdfcbank.bank.in (primary)
  alerts@hdfcbank.com
  hdfcbank@hdfcbank.net
  noreply@hdfcbank.com
  notification@hdfcbank.com
       ↓
get_email_text() extracts body:
  1. Tries text/plain MIME part
  2. Falls back to text/html (strips tags)
  3. Falls back to Gmail snippet
       ↓
parse_hdfc_email() runs NLP:
  → Extract amount via regex
  → Extract UPI reference number (dedup key)
  → Extract merchant name via spaCy NER / regex
  → Classify category via TF-IDF
       ↓
Duplicate check:
  IF upi_ref already in DB → skip
  ELSE IF gmail_message_id already in DB → skip
  ELSE → save as new expense (source=auto)
       ↓
Expense saved to PostgreSQL
       ↓
Frontend refetches every 30s → appears on dashboard
with ⚡ auto badge
```

### OAuth Flow (PKCE)

```
User clicks "Connect Gmail"
       ↓
Frontend calls GET /api/gmail/connect
       ↓
Backend generates:
  - state (random token)
  - code_verifier (random bytes)
  - code_challenge = SHA256(code_verifier)
Stores {state → user_id + code_verifier} in memory
Returns Google auth URL with PKCE params
       ↓
Frontend redirects to Google
       ↓
User approves Gmail read access
       ↓
Google redirects to:
  GET /api/gmail/callback?code=...&state=...
       ↓
Backend exchanges code + code_verifier for tokens
Saves access_token + refresh_token to gmail_tokens table
Sets user.gmail_connected = True
Redirects to frontend /gmail?connected=true
       ↓
Frontend shows "Connected" state
```

---

## 9. NLP & Category Classification

### Two-stage pipeline

**Stage 1 — Entity extraction (spaCy)**

`spacy.load("en_core_web_sm")` runs Named Entity Recognition on email body.
Extracts:
- `ORG` entities → merchant/business names (Zomato, Google Cloud)
- `PERSON` entities → individual names (Rahul Sharma)
- `PRODUCT` entities → product names

Also uses regex patterns for HDFC-specific formats:
```
"to VPA 9876@ibl ZOMATO UPI on 19-04-26"
                  ↑
          extracted as merchant
```

**Stage 2 — Category classification (TF-IDF + cosine similarity)**

1. Check if merchant looks like a person name → `Personal Transfer 👤`
2. Check if it's a known service (Zomato, Uber, etc.)
3. Transform description with TF-IDF vectorizer
4. Compute cosine similarity against training examples
5. Return highest-scoring category
6. If similarity < 0.1 → `Personal Transfer 👤`

### Categories & Emojis

| Category | Emoji | Examples |
|---|---|---|
| Food & Dining | 🍕 | Zomato, Swiggy, restaurants |
| Transport | 🚗 | Uber, Ola, petrol, metro |
| Groceries | 🛒 | BigBasket, DMart, kirana |
| Shopping | 🛍️ | Amazon, Flipkart, Myntra |
| Entertainment | 🎬 | Netflix, Spotify, movies |
| Health | 💊 | Apollo, Medplus, hospital |
| Bills & Utilities | 💡 | Airtel, Jio, electricity |
| Education | 📚 | Udemy, Coursera, school fees |
| Travel | ✈️ | Flights, hotels, IRCTC |
| Personal Transfer | 👤 | Individual person names |
| Other | 📦 | Everything else |

### Duplicate Prevention

UPI reference numbers are globally unique per transaction. We store them in `expenses.upi_ref`.

Before saving any auto-synced expense:
1. Load all existing `upi_ref` values for this user into a Python set
2. Load all existing `gmail_message_id` values into another set
3. For each new email: check both sets before saving
4. Also add newly saved refs to the in-memory sets to prevent duplicates within the same sync run

---

## 10. Authentication Flow

### Signup
```
POST /api/auth/signup
Body: { name, email, password }

1. Check if email already exists
2. Hash password with bcrypt
3. Create User record
4. Generate JWT (expires in 7 days)
5. Return { access_token, user }

Frontend:
- Save token to localStorage.paisa_token
- Save user to localStorage.paisa_user
- Redirect to /
```

### Login
```
POST /api/auth/login
Body: { email, password }

1. Find user by email
2. Verify password with bcrypt.checkpw()
3. Generate JWT
4. Return { access_token, user }
```

### JWT Structure
```json
{
  "sub": "user-uuid-here",
  "exp": 1234567890
}
```

### Protected Routes
Every API call (except auth) sends:
```
Authorization: Bearer <token>
```

`get_current_user` dependency in FastAPI:
1. Extracts token from Authorization header
2. Decodes JWT → gets `sub` (user_id)
3. Loads user from DB
4. Returns user object to endpoint

---

## 11. API Reference

### Request/Response Examples

**Signup**
```json
POST /api/auth/signup
{
  "name": "Devansh Upadhyay",
  "email": "devansh@example.com",
  "password": "mypassword123"
}

Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "name": "Devansh Upadhyay",
    "email": "devansh@example.com",
    "gmail_connected": false
  }
}
```

**Get Expenses**
```json
GET /api/expenses?month=4&year=2026
Authorization: Bearer <token>

Response: [
  {
    "id": "uuid",
    "description": "Zomato",
    "amount": 340.0,
    "category": "Food & Dining",
    "emoji": "🍕",
    "date": "2026-04-19",
    "type": "debit",
    "source": "auto",
    "created_at": "2026-04-19T10:30:00"
  }
]
```

**Monthly Stats**
```json
GET /api/stats/monthly?month=4&year=2026
Authorization: Bearer <token>

Response:
{
  "total_spent": 12450.0,
  "remaining": 40550.0,
  "transaction_count": 23,
  "daily_average": 415.0,
  "top_category": "Food & Dining",
  "auto_synced_count": 18
}
```

---

## 12. Environment Variables

### `frontend/.env.local`
```
VITE_API_URL=http://localhost:8000
```

### `backend/.env`
```
DATABASE_URL=postgresql://localhost/paisa_db
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
FRONTEND_URL=http://localhost:8080
```

### Required for Gmail Sync
```bash
export OAUTHLIB_INSECURE_TRANSPORT=1  # Local dev only — remove in production
```

---

## 13. Running Locally

### Prerequisites
- Node.js 18+
- Python 3.12
- PostgreSQL 16
- Google Cloud project with Gmail API enabled

### Setup

**1. Database**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb paisa_db
```

**2. Backend**
```bash
cd paisa/backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Add credentials.json (from Google Cloud Console)
cp ~/Downloads/client_secret_xxx.json credentials.json

# Start server
export OAUTHLIB_INSECURE_TRANSPORT=1
uvicorn app.main:app --reload --port 8000
```

**3. Frontend**
```bash
cd paisa/frontend
npm install
npm run dev
# Opens at http://localhost:8080
```

**4. Verify**
- Backend health: http://localhost:8000/health
- API docs: http://localhost:8000/docs
- Frontend: http://localhost:8080

---

## 14. Key Design Decisions

### Why TF-IDF over LLM for category classification?
- Runs locally, zero API cost, zero latency
- Fast enough for real-time classification
- Deterministic — same input always gives same output
- Can be improved by adding more training examples
- LLM fallback can be added later for unknowns

### Why APScheduler over Gmail Pub/Sub?
- Pub/Sub requires Google Cloud billing setup (credit card)
- APScheduler is free, runs inside FastAPI, zero external dependencies
- 5-minute polling is acceptable for expense tracking
- Can be upgraded to Pub/Sub when deploying to production

### Why UPI reference number for deduplication?
- Gmail message IDs change if email is moved/copied between folders
- UPI reference numbers are globally unique per RBI mandate
- More reliable than message IDs across re-syncs

### Why PKCE for OAuth?
- Google now requires PKCE for Web application type OAuth clients
- More secure than implicit flow — prevents authorization code interception
- Works without client secret in the token exchange

### Why separate `source` field (manual/auto)?
- Users can see which transactions were auto-detected vs manually entered
- Useful for filtering and analytics
- Shows the ⚡ auto badge in the UI for transparency

### Why store budgets in DB instead of frontend state?
- Budgets persist across devices and sessions
- Each user has their own budget limits
- Can be used in backend for budget alert logic in the future

---

## 15. Known Limitations & Future Work

### Current Limitations

| Issue | Impact | Fix |
|---|---|---|
| Gmail sync only works for HDFC Bank | Other bank users can't use auto-sync | Add parsers for SBI, ICICI, Axis email formats |
| OAuth tokens stored in-memory (`_auth_store`) | Restarting server loses pending OAuth flows | Use Redis or DB for state storage |
| Budget limits stored only in frontend during edit | Not persisted until Save clicked | Auto-save on change |
| No email notifications for budget overspend | User has to check manually | Add email/push notifications |
| Month navigation in Header doesn't pass month to child components | Stats always show current month | Lift month state to Index.tsx context |
| No pagination on transactions | All transactions load at once | Add cursor-based pagination |

### Planned Features

- [ ] **Multi-bank support** — SBI, ICICI, Axis Bank email parsers
- [ ] **Recurring expense detection** — flag subscriptions (Netflix, Spotify)
- [ ] **Spending insights** — "You spent 20% more on Food this month"
- [ ] **Export to CSV/PDF** — monthly expense reports
- [ ] **Budget alerts** — email when 80% of budget is used
- [ ] **Split expenses** — divide bills among friends
- [ ] **Receipt photo scan** — OCR for offline receipts
- [ ] **Deploy to production** — Vercel (frontend) + Render (backend) + Supabase (DB)

### Deployment Checklist (when ready)

```
Frontend (Vercel):
  ✅ Update VITE_API_URL to production backend URL
  ✅ npm run build → deploy dist/

Backend (Render):
  ✅ Remove OAUTHLIB_INSECURE_TRANSPORT
  ✅ Update CORS origins to production frontend URL
  ✅ Update Gmail OAuth redirect URI to production URL
  ✅ Use environment variables for all secrets
  ✅ Switch from SQLite to managed PostgreSQL

Google Cloud:
  ✅ Add production redirect URI to OAuth credentials
  ✅ Submit app for Google verification (for public launch)
```

---

*Last updated: April 2026*
*Built with Claude — Anthropic*
