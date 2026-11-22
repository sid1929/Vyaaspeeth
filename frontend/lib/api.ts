export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "")

export type User = { id: string; name: string; email: string }
export type Booking = {
  bookingReference: string; eventId: string; eventTitle: string; eventStartsAt: string
  seats: { seat: string; tier: "Premium" | "Standard" | "Economy"; price: number }[]; quantity: number
  subtotal: number; serviceFee: number; total: number; fullName: string; phone: string | null
  status: "Pending" | "Confirmed" | "Cancelled" | "Expired"
  paymentStatus: "Pending" | "Completed" | "Failed" | "Refunded"
  paymentMethod: string | null; paidAt: string | null; expiresAt: string; createdAt: string
}
export type PaymentMethod = "Credit Card" | "Debit Card" | "UPI" | "Net Banking" | "Wallet"

export class ApiError extends Error {
  status: number
  fieldErrors: Record<string, string>
  data: { seats?: string[]; hint?: string }
  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}, data: ApiError["data"] = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
    this.data = data
  }
}

/**
 * Session token lives in sessionStorage: it is cleared when the tab closes and is never sent
 * automatically by the browser (so there is no CSRF surface). Trade-off: script running on the page
 * could read it, which is why the app ships a strict CSP and renders no untrusted HTML.
 */
const TOKEN_KEY = "vy_token"
const safe = <T,>(fn: () => T, fallback: T): T => { try { return fn() } catch { return fallback } }
/** "Keep me signed in" stores the token in localStorage; otherwise it lives in sessionStorage (gone when the tab closes). */
export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : safe(() => window.sessionStorage.getItem(TOKEN_KEY) ?? window.localStorage.getItem(TOKEN_KEY), null)),
  set: (t: string, remember = true) => {
    safe(() => { window.sessionStorage.removeItem(TOKEN_KEY); window.localStorage.removeItem(TOKEN_KEY) }, undefined)
    safe(() => (remember ? window.localStorage : window.sessionStorage).setItem(TOKEN_KEY, t), undefined)
  },
  clear: () => safe(() => { window.sessionStorage.removeItem(TOKEN_KEY); window.localStorage.removeItem(TOKEN_KEY) }, undefined),
}

async function request<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const token = tokenStore.get()
  if (token && init.auth !== false) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
  } catch {
    throw new ApiError(
      process.env.NODE_ENV === "production"
        ? "Cannot reach the booking service. Please check your connection and try again."
        : `Cannot reach the API at ${API_BASE_URL}. Is the backend running (npm run dev:memory in /backend) and does CORS_ORIGINS allow this site?`,
      0,
    )
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.clear()
      if (typeof window !== "undefined") window.dispatchEvent(new Event("vy:unauthorized"))
    }
    const fieldErrors: Record<string, string> = {}
    for (const e of (data.errors ?? []) as { field: string; message: string }[]) fieldErrors[e.field] ??= e.message
    throw new ApiError(data.message || "Something went wrong", res.status, fieldErrors, { seats: data.seats, hint: data.hint })
  }
  return data as T
}

type AuthResult = { token: string; user: User }
export const api = {
  signup: (b: { name: string; email: string; password: string }) => request<AuthResult>("/signup", { method: "POST", body: b, auth: false }),
  login: (b: { email: string; password: string }) => request<AuthResult>("/login", { method: "POST", body: b, auth: false }),
  me: () => request<{ user: User }>("/me"),
  logout: () => request<{ message: string }>("/logout", { method: "POST" }),
  health: () => request<{ status: string; database: string }>("/health", { auth: false }),
  seats: (eventId: string) => request<{ eventId: string; taken: string[]; serverTime: string }>(`/events/${encodeURIComponent(eventId)}/seats`, { auth: false }),
  createBooking: (b: { eventId: string; seats: string[]; attendee: { fullName: string; phone?: string } }) =>
    request<{ booking: Booking }>("/bookings", { method: "POST", body: b }),
  bookings: () => request<{ bookings: Booking[] }>("/bookings"),
  booking: (ref: string) => request<{ booking: Booking }>(`/bookings/${encodeURIComponent(ref)}`),
  cancel: (ref: string) => request<{ message: string; booking: Booking }>(`/bookings/${encodeURIComponent(ref)}/cancel`, { method: "POST" }),
  pay: (b: { bookingReference: string; method: PaymentMethod; simulate?: "success" | "fail" }) =>
    request<{ outcome: string; booking: Booking }>("/payments/mock-checkout", { method: "POST", body: b }),
  sendMessage: (b: { kind: "contact" | "feedback"; name: string; email: string; subject?: string; message: string; rating?: number; website?: string }) =>
    request<{ message: string }>("/messages", { method: "POST", body: b, auth: false }),
}
