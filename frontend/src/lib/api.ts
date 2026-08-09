const BASE_URL = import.meta.env.VITE_API_URL

// ── HELPERS ──────────────────────────────────────────────
function getToken(): string | null {
  return localStorage.getItem('paisa_token')
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || 'Request failed')
  }

  return res.json()
}

// ── AUTH ─────────────────────────────────────────────────
export interface LoginPayload {
  email: string
  password: string
}

export interface SignupPayload {
  name: string
  email: string
  password: string
}

export interface MFAVerifyPayload {
  email: string
  code: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: {
    id: string
    name: string
    email: string
    is_verified: boolean
    total_monthly_budget: number | null
    bank_alert_emails: string[] | null
  }
}

export const authApi = {
  login: (data: LoginPayload) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  signup: (data: SignupPayload) =>
    request<{ message: string; email: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyMfa: (data: MFAVerifyPayload) =>
    request<AuthResponse>('/api/auth/verify-mfa', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<AuthResponse['user']>('/api/auth/me'),

  getSettings: () =>
    request<{ total_monthly_budget: number | null; bank_alert_emails: string[] }>('/api/auth/settings'),

  updateSettings: (data: { total_monthly_budget?: number; bank_alert_emails?: string[] }) =>
    request<{ total_monthly_budget: number | null; bank_alert_emails: string[] }>('/api/auth/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}


// ── EXPENSES ─────────────────────────────────────────────
export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  emoji: string
  date: string
  type: 'debit' | 'credit'
  source: 'manual' | 'auto'
  created_at: string
}

export interface CreateExpensePayload {
  description: string
  amount: number
  category: string
  emoji: string
  date: string
  type: 'debit' | 'credit'
}

export interface UpdateExpensePayload extends Partial<CreateExpensePayload> {}

export const expensesApi = {
  getAll: (month?: number, year?: number) => {
    const params = new URLSearchParams()
    if (month !== undefined) params.append('month', String(month))
    if (year !== undefined) params.append('year', String(year))
    return request<Expense[]>(`/api/expenses?${params.toString()}`)
  },

  create: (data: CreateExpensePayload) =>
    request<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateExpensePayload) =>
    request<Expense>(`/api/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/expenses/${id}`, {
      method: 'DELETE',
    }),
}

// ── BUDGETS ──────────────────────────────────────────────
export interface Budget {
  id: string
  category: string
  emoji: string
  limit: number
}

export const budgetsApi = {
  getAll: () => request<Budget[]>('/api/budgets'),
  update: (id: string, limit: number) =>
    request<Budget>(`/api/budgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ limit }),
    }),
}

// ── STATS ────────────────────────────────────────────────
export interface MonthlyStats {
  total_spent: number
  remaining: number
  transaction_count: number
  daily_average: number
  top_category: string
  auto_synced_count: number
}

export const statsApi = {
  getMonthly: (month: number, year: number) =>
    request<MonthlyStats>(`/api/stats/monthly?month=${month}&year=${year}`),
}

// ── GMAIL SYNC ───────────────────────────────────────────
export const gmailApi = {
  getStatus: () => request<{ connected: boolean; gmail_email: string | null }>('/api/gmail/status'),
  getConnectUrl: () => request<{ auth_url: string }>('/api/gmail/connect'),
  sync: () => request<{ synced: number; message: string }>('/api/gmail/sync', { method: 'POST' }),
  disconnect: () => request<{ message: string }>('/api/gmail/disconnect', { method: 'DELETE' }),
}
