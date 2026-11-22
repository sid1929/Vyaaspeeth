"use client"
import { useEffect, useState } from "react"
import { Timer } from "lucide-react"
import { cn } from "@/lib/utils"

/** Counts down the 15-minute seat hold. The server is what actually expires the hold. */
export function HoldTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire?: () => void }) {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    let fired = false
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now()
      setLeft(Math.max(0, ms))
      if (ms <= 0 && !fired) { fired = true; onExpire?.() }
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [expiresAt, onExpire])
  if (left === null) return null
  const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000)
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tabular-nums", left < 120000 ? "bg-destructive/15 text-destructive" : "bg-gold/20 text-gold")}>
      <Timer className="h-3.5 w-3.5" />{left === 0 ? "Hold expired" : `Held for ${m}:${String(s).padStart(2, "0")}`}
    </span>
  )
}
