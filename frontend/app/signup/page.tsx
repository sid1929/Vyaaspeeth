"use client"
import Link from "next/link"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth-shell"
import { PasswordMeter } from "@/components/password-meter"
import { ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { safeNext } from "@/lib/redirect"

function SignupForm() {
  const { signup } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNext(params.get("next"))
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(null); setFields({})
    try {
      const u = await signup(name.trim(), email.trim(), password, remember)
      toast.success(`Welcome to Vyaaspeeth, ${u.name.split(" ")[0]}! 🎟️`)
      router.replace(next)
    } catch (err) {
      if (err instanceof ApiError) { setFields(err.fieldErrors); setError(Object.keys(err.fieldErrors).length ? null : err.message) }
      else setError("Something went wrong. Please try again.")
    } finally { setBusy(false) }
  }

  const Err = ({ k }: { k: string }) => (fields[k] ? <p className="text-sm text-destructive">{fields[k]}</p> : null)

  return (
    <AuthShell title="Join the audience" subtitle="Create your free account to book tickets in seconds."
      footer={<>Already have an account? <Link href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-primary hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <div className="relative"><User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl pl-10" maxLength={60} /></div>
          <Err k="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl pl-10" placeholder="you@example.com" maxLength={254} /></div>
          <Err k="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type={show ? "text" : "password"} autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl pl-10 pr-11" maxLength={72} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </div>
          <PasswordMeter value={password} />
          <Err k="password" />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />Keep me signed in on this device</label>
        {error && <p role="alert" className="animate-fade-up rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy || !name || !email || !password} className="btn-glow h-12 w-full rounded-full text-base">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</> : "Create account"}</Button>
        <p className="text-center text-xs text-muted-foreground">Your password is hashed with bcrypt and never stored or logged in plain text.</p>
      </form>
    </AuthShell>
  )
}

export default function SignupPage() {
  return <Suspense fallback={<div className="container py-16"><div className="skeleton mx-auto h-96 max-w-md" /></div>}><SignupForm /></Suspense>
}
