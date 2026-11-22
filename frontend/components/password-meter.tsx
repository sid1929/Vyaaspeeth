"use client"
import { cn } from "@/lib/utils"

export function passwordScore(pw: string) {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Za-z]/.test(pw) && /[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw) || (/[a-z]/.test(pw) && /[A-Z]/.test(pw))) s++
  return s
}
const LABELS = ["Too weak", "Weak", "Okay", "Strong", "Excellent"]
const COLORS = ["bg-destructive", "bg-destructive", "bg-gold", "bg-success", "bg-success"]

/** Hint only: the server enforces the real password rules (8–72 chars, letter + number). */
export function PasswordMeter({ value }: { value: string }) {
  const s = value ? passwordScore(value) : 0
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => <span key={i} className={cn("h-1.5 flex-1 rounded-full bg-muted transition-colors duration-300", value && i < s && COLORS[s])} />)}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{value ? LABELS[s] : "Use 8+ characters with a letter and a number"}</p>
    </div>
  )
}
