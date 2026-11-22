"use client"
import { useState } from "react"
import { CheckCircle2, Loader2, Send, Star } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiError, api } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

export function MessageForm({ kind }: { kind: "contact" | "feedback" }) {
  const { user } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [website, setWebsite] = useState("") // honeypot
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [fields, setFields] = useState<Record<string, string>>({})

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setFields({})
    try {
      await api.sendMessage({ kind, name: (name || user?.name || "").trim(), email: (email || user?.email || "").trim(), subject: subject.trim() || undefined, message: message.trim(), rating: rating || undefined, website: website || undefined })
      setSent(true); toast.success("Thank you! We received your message.")
    } catch (err) {
      if (err instanceof ApiError) { setFields(err.fieldErrors); if (!Object.keys(err.fieldErrors).length) toast.error(err.message) } else toast.error("Something went wrong.")
    } finally { setBusy(false) }
  }

  if (sent) {
    return (
      <div className="glass grid place-items-center rounded-3xl px-6 py-16 text-center animate-fade-up">
        <CheckCircle2 className="h-14 w-14 animate-pop text-success" />
        <h2 className="mt-4 font-display text-2xl font-bold">Message sent</h2>
        <p className="mt-1 text-muted-foreground">Thanks for reaching out. We&apos;ll get back to you soon.</p>
        <Button variant="outline" className="mt-6 rounded-full" onClick={() => { setSent(false); setMessage(""); setRating(0) }}>Send another</Button>
      </div>
    )
  }
  const Err = ({ k }: { k: string }) => (fields[k] ? <p className="text-sm text-destructive">{fields[k]}</p> : null)
  return (
    <form onSubmit={submit} className="glass space-y-5 rounded-3xl p-6 sm:p-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="m-name">Name</Label><Input id="m-name" value={name || user?.name || ""} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" maxLength={80} required /><Err k="name" /></div>
        <div className="space-y-2"><Label htmlFor="m-email">Email</Label><Input id="m-email" type="email" value={email || user?.email || ""} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" maxLength={254} required /><Err k="email" /></div>
      </div>
      {kind === "contact" && <div className="space-y-2"><Label htmlFor="m-subject">Subject <span className="text-muted-foreground">(optional)</span></Label><Input id="m-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="h-12 rounded-xl" maxLength={120} /></div>}
      {kind === "feedback" && (
        <div className="space-y-2">
          <Label>How was your experience?</Label>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} className="p-1 transition-transform hover:scale-125">
                <Star className={cn("h-8 w-8 transition-colors", (hover || rating) >= n ? "fill-gold text-gold" : "text-muted-foreground/40")} />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-2"><Label htmlFor="m-msg">{kind === "contact" ? "Message" : "Tell us more"}</Label><Textarea id="m-msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={2000} className="rounded-xl" required /><div className="flex justify-between"><Err k="message" /><span className="ml-auto text-xs text-muted-foreground">{message.length}/2000</span></div></div>
      {/* Honeypot: invisible to people, tempting to bots */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label></div>
      <Button type="submit" disabled={busy || message.trim().length < 10} className="btn-glow h-12 rounded-full px-8">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</> : <><Send className="mr-2 h-4 w-4" />Send {kind === "contact" ? "message" : "feedback"}</>}</Button>
    </form>
  )
}
