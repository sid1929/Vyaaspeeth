"use client"
import { useEffect, useState } from "react"

const units = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return [["days", Math.floor(s / 86400)], ["hrs", Math.floor((s % 86400) / 3600)], ["min", Math.floor((s % 3600) / 60)], ["sec", s % 60]] as const
}

export function Countdown({ to }: { to: string }) {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setLeft(new Date(to).getTime() - Date.now())
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [to])
  const parts = units(left ?? 0)
  return (
    <div className="flex gap-2" role="timer" aria-label="Time until the event starts">
      {parts.map(([label, v]) => (
        <div key={label} className="glass min-w-[3.6rem] rounded-2xl px-3 py-2 text-center">
          <div className="font-display text-2xl font-extrabold tabular-nums">{left === null ? "--" : String(v).padStart(2, "0")}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  )
}
