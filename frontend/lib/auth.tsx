"use client"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { api, tokenStore, type User } from "@/lib/api"

type AuthState = {
  user: User | null
  ready: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<User>
  signup: (name: string, email: string, password: string, remember?: boolean) => Promise<User>
  logout: () => Promise<void>
}
const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  // Restore the session by asking the SERVER who the token belongs to (never trust stored user data).
  useEffect(() => {
    let alive = true
    if (!tokenStore.get()) { setReady(true); return }
    api.me().then((r) => alive && setUser(r.user)).catch(() => tokenStore.clear()).finally(() => alive && setReady(true))
    const onUnauthorized = () => { setUser(null); toast.error("Your session expired. Please sign in again.") }
    window.addEventListener("vy:unauthorized", onUnauthorized)
    return () => { alive = false; window.removeEventListener("vy:unauthorized", onUnauthorized) }
  }, [])

  const login = useCallback(async (email: string, password: string, remember = true) => {
    const r = await api.login({ email, password }); tokenStore.set(r.token, remember); setUser(r.user); return r.user
  }, [])
  const signup = useCallback(async (name: string, email: string, password: string, remember = true) => {
    const r = await api.signup({ name, email, password }); tokenStore.set(r.token, remember); setUser(r.user); return r.user
  }, [])
  const logout = useCallback(async () => {
    try { await api.logout() } catch { /* token may already be invalid */ }
    tokenStore.clear(); setUser(null)
  }, [])

  const value = useMemo(() => ({ user, ready, login, signup, logout }), [user, ready, login, signup, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useAuth must be used inside <AuthProvider>")
  return c
}

/** Client-side guard for UX only. The API enforces authentication on every protected route. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
  }, [ready, user, router, pathname])
  if (!ready || !user) {
    return <div className="container py-24 grid place-items-center"><div className="skeleton h-40 w-full max-w-xl" /></div>
  }
  return <>{children}</>
}
