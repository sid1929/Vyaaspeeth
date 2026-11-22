"use client"
import { useEffect, useState } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { API_BASE_URL, api } from "@/lib/api"

/** Shows a clear banner when the API cannot be reached, instead of silently failing sign-in and booking. */
export function ApiStatus() {
  const [down, setDown] = useState(false)
  useEffect(() => {
    let alive = true
    const check = () => api.health().then(() => alive && setDown(false)).catch(() => alive && setDown(true))
    check()
    const t = setInterval(check, 8000)
    return () => { alive = false; clearInterval(t) }
  }, [])
  if (!down) return null
  const dev = process.env.NODE_ENV !== "production"
  return (
    <div role="alert" className="border-b border-destructive/40 bg-destructive/15 px-4 py-2.5 text-center text-sm">
      <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        {dev ? <>
          <b>Can&apos;t reach the API at <code className="font-mono">{API_BASE_URL}</code>.</b>
          Start it with <code className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-xs">npm run dev:memory</code> in <code className="font-mono">/backend</code>, or check <code className="font-mono">NEXT_PUBLIC_API_URL</code> and <code className="font-mono">CORS_ORIGINS</code>.
        </> : <b>The booking service is temporarily unavailable. Retrying…</b>}
        <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      </span>
    </div>
  )
}
