"use client"
import Link from "next/link"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth-shell"
import { ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { safeNext } from "@/lib/redirect"

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNext(params.get("next"))
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const u = await login(email.trim(), password, remember)
      toast.success(`Welcome back, ${u.name.split(" ")[0]}!`)
      router.replace(next)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.")
    } finally { setBusy(false) }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see your tickets and book your next show."
      footer={<>New here? <Link href={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-primary hover:underline">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl pl-10" placeholder="you@example.com" maxLength={254} /></div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl pl-10 pr-11" maxLength={72} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />Keep me signed in on this device</label>
        {error && <p role="alert" className="animate-fade-up rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy || !email || !password} className="btn-glow h-12 w-full rounded-full text-base">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</> : "Sign in"}</Button>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return <Suspense fallback={<div className="container py-16"><div className="skeleton mx-auto h-96 max-w-md" /></div>}><LoginForm /></Suspense>
}
