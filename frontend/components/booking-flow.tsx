"use client"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarPlus, Check, Loader2, Lock, RefreshCw, ShieldCheck, Ticket, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Poster } from "@/components/poster"
import { SeatMap } from "@/components/seat-map"
import { PaymentMethods } from "@/components/payment-methods"
import { HoldTimer } from "@/components/hold-timer"
import { Confetti } from "@/components/confetti"
import { TicketView } from "@/components/ticket-view"
import { ApiError, api, type Booking, type PaymentMethod } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { MAX_QTY, SERVICE_FEE, dayParts, formatDate, formatINR, formatOf, getEvent, ordinal, parseSeat, seatPrice, seatTier, totalSeats } from "@/lib/events"
import { downloadCalendar } from "@/lib/ics"
import { cn } from "@/lib/utils"

const STEPS = ["Choose your place", "Payment", "Ticket"]
const PHONE = /^[+0-9 ()-]{7,20}$/

export function BookingFlow() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const event = getEvent(id)

  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [taken, setTaken] = useState<Set<string>>(new Set())
  const [seatsState, setSeatsState] = useState<"loading" | "ready" | "error">("loading")
  const [seatError, setSeatError] = useState("")
  const [fullName, setFullName] = useState(user?.name ?? "")
  const [phone, setPhone] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("UPI")
  const [simulateFail, setSimulateFail] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const locked = !!booking
  const done = booking?.status === "Confirmed"

  const loadSeats = useCallback(async (silent = false) => {
    try {
      const r = await api.seats(id)
      setTaken(new Set(r.taken)); setSeatsState("ready")
    } catch (e) {
      if (!silent) { setSeatsState("error"); setSeatError(e instanceof ApiError ? e.message : "Could not load the seat map") }
    }
  }, [id])

  // initial load + live refresh so seats booked by other people disappear while you choose
  useEffect(() => {
    loadSeats()
    const t = setInterval(() => { if (document.visibilityState === "visible" && !locked) loadSeats(true) }, 12000)
    return () => clearInterval(t)
  }, [loadSeats, locked])

  useEffect(() => {
    if (locked) return
    const gone = selected.filter((s) => taken.has(s))
    if (gone.length) { setSelected((sel) => sel.filter((s) => !taken.has(s))); toast.error(`${gone.join(", ")} ${gone.length > 1 ? "were" : "was"} just taken. Please pick another.`) }
  }, [taken, locked, selected])

  const toggle = useCallback((seat: string) => {
    setSelected((sel) => {
      if (sel.includes(seat)) return sel.filter((s) => s !== seat)
      if (sel.length >= MAX_QTY) { toast.error(`You can book up to ${MAX_QTY} seats at a time`); return sel }
      return [...sel, seat]
    })
  }, [])

  const sortedSel = useMemo(() => [...selected].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [selected])
  if (!event) {
    return <div className="container py-24 text-center"><h1 className="font-display text-3xl font-bold">Event not found</h1><Button asChild className="mt-6 rounded-full"><Link href="/events">Browse events</Link></Button></div>
  }

  const subtotal = booking?.subtotal ?? sortedSel.reduce((n, s) => n + seatPrice(event, s), 0)
  const fee = booking?.serviceFee ?? SERVICE_FEE
  const total = sortedSel.length || booking ? subtotal + fee : 0
  const d = dayParts(event.startsAt)
  const left = totalSeats(event) - taken.size

  const release = () => {
    if (booking) api.cancel(booking.bookingReference).catch(() => { /* hold expires on its own */ })
    setBooking(null); setSelected([]); setStep(1); loadSeats(true)
  }

  const toPayment = () => {
    if (!selected.length) return toast.error("Pick at least one seat")
    setStep(2)
  }

  const pay = async () => {
    const e: Record<string, string> = {}
    if (fullName.trim().length < 2) e["attendee.fullName"] = "Please enter the attendee's full name"
    if (phone.trim() && !PHONE.test(phone.trim())) e["attendee.phone"] = "Enter a valid phone number or leave it blank"
    setErrors(e)
    if (Object.keys(e).length) return

    setBusy(true)
    try {
      let b = booking
      if (!b) {
        const r = await api.createBooking({ eventId: event.id, seats: sortedSel, attendee: { fullName: fullName.trim(), phone: phone.trim() || undefined } })
        b = r.booking; setBooking(b)
      }
      const r = await api.pay({ bookingReference: b.bookingReference, method, simulate: simulateFail ? "fail" : "success" })
      setBooking(r.booking)
      if (r.booking.status === "Confirmed") toast.success("Payment confirmed. Enjoy the show! 🎉")
      else toast.error("Payment was declined. Your seats are still held, so try again.")
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          // seats taken by someone else, or the hold expired
          await loadSeats(true)
          if (err.data.seats?.length) setSelected((sel) => sel.filter((s) => !err.data.seats!.includes(s)))
          setBooking(null); setStep(1)
        } else if (Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors)
        toast.error(err.message)
      } else toast.error("Something went wrong. Please try again.")
    } finally { setBusy(false) }
  }

  /* ---------- step 3: ticket ---------- */
  if (done && booking) {
    return (
      <div className="container max-w-2xl py-14 text-center">
        <Confetti run />
        <div className="mx-auto grid h-20 w-20 animate-pop place-items-center rounded-full bg-success/15 text-success"><Check className="h-10 w-10" strokeWidth={3} /></div>
        <h1 className="mt-6 animate-fade-up font-display text-4xl font-extrabold">You&apos;re going! 🎉</h1>
        <p className="mt-2 animate-fade-up text-muted-foreground">Payment verified by our server. Your e-ticket is below and saved in My bookings.</p>
        <div className="mt-8 animate-fade-up text-left" style={{ animationDelay: "150ms" }}><TicketView booking={booking} /></div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button className="btn-glow rounded-full px-6" onClick={() => router.push("/my-bookings")}><Ticket className="mr-2 h-4 w-4" />My bookings</Button>
          <Button variant="outline" className="rounded-full" onClick={() => downloadCalendar(booking)}><CalendarPlus className="mr-2 h-4 w-4" />Add to calendar</Button>
          <Button variant="ghost" className="rounded-full" asChild><Link href="/events">Browse more</Link></Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* cinematic hero */}
      <section className="relative -mt-16 overflow-hidden pt-16">
        <Poster id={event.id} className="absolute inset-0 scale-110 opacity-60 blur-2xl"><span /></Poster>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-[hsl(var(--background))]" />
        <div className="container relative flex min-h-[190px] items-end pb-8 pt-10">
          <div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur">{event.category}</span>
            <h1 className="mt-3 font-marquee text-5xl uppercase leading-none tracking-wide text-white drop-shadow sm:text-7xl">{event.title}</h1>
          </div>
        </div>
      </section>

      <div className="container grid gap-8 pb-16 pt-6 lg:grid-cols-[250px_1fr_170px] xl:grid-cols-[280px_1fr_190px]">
        {/* LEFT: poster + selected seats + total */}
        <aside className="order-2 space-y-4 lg:order-none">
          <Poster id={event.id} className="hidden aspect-[3/4] rounded-2xl shadow-2xl lg:block">
            <div className="absolute bottom-3 left-4 right-4 font-display text-lg font-bold leading-tight text-white">{event.title}</div>
          </Poster>

          <div className="space-y-2.5" aria-live="polite">
            {sortedSel.length === 0 && <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">No seats selected yet. Tap a seat on the map.</p>}
            {sortedSel.map((s) => {
              const { row, col } = parseSeat(s)
              return (
                <div key={s} className="flex animate-fade-up items-center justify-between rounded-xl border bg-card/70 px-4 py-2.5 backdrop-blur">
                  <span className="flex items-baseline gap-3 text-sm text-muted-foreground">
                    <span className="flex items-baseline gap-1.5"><b className="font-marquee text-3xl leading-none text-foreground">{row}</b>row</span>
                    <span className="flex items-baseline"><b className="font-marquee text-3xl leading-none text-foreground">{col}</b><span className="ml-0.5">{ordinal(col)}</span><span className="ml-1.5">seat</span></span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {formatINR(seatPrice(event, s))}
                    {!locked && <button onClick={() => toggle(s)} aria-label={`Remove seat ${s}`} className="rounded-full p-1 hover:bg-accent hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="space-y-1 text-right text-sm">
            <div className="text-muted-foreground">Seats: {sortedSel.length ? formatINR(subtotal) : "-"} · Fee: {formatINR(fee)}</div>
            <div>Total <b key={total} className="ml-2 inline-block animate-pop font-marquee text-4xl tracking-wide">{formatINR(total)}</b></div>
            {locked && <p className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-success" />Price verified by the server</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="rounded-md border-primary/60 font-semibold uppercase tracking-wide text-primary hover:bg-primary/10" onClick={() => (locked ? release() : router.push(`/events/${event.id}`))}>Cancel</Button>
            {step === 1
              ? <Button className="btn-glow rounded-md font-semibold uppercase tracking-wide" disabled={!sortedSel.length} onClick={toPayment}>Next</Button>
              : <Button variant="secondary" className="rounded-md font-semibold uppercase tracking-wide" disabled={busy} onClick={() => setStep(1)}>Back</Button>}
          </div>
        </aside>

        {/* CENTER: steps + seat map / payment */}
        <section className="order-1 min-w-0 lg:order-none">
          <ol className="mb-6 grid grid-cols-3 gap-4 text-xs uppercase tracking-wider" aria-label="Checkout progress">
            {STEPS.map((label, i) => {
              const n = i + 1, state = step > n ? "done" : step === n ? "now" : "todo"
              return (
                <li key={label} className={cn("border-b-2 pb-2.5 transition-colors", state === "todo" ? "border-border text-muted-foreground" : "border-primary text-foreground")}>
                  <span className={cn("mr-2 inline-grid h-5 w-5 place-items-center rounded bg-muted font-mono text-[11px]", state !== "todo" && "bg-primary text-primary-foreground")}>{n}</span>{label}
                </li>
              )
            })}
          </ol>

          {locked && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gold/10 p-4 text-sm">
              <span className="flex items-center gap-2"><Lock className="h-4 w-4 text-gold" />Seats held · Ref <b className="font-mono">{booking.bookingReference}</b></span>
              <HoldTimer expiresAt={booking.expiresAt} onExpire={() => { toast.error("Your hold expired. Please choose seats again."); setBooking(null); setSelected([]); setStep(1); loadSeats(true) }} />
            </div>
          )}

          {step === 1 && (
            <div className="rounded-3xl bg-[#0b0b10] p-5 shadow-2xl ring-1 ring-white/10 sm:p-8 dark:bg-black/60">
              {seatsState === "loading" && <div className="skeleton h-[420px] bg-white/10" />}
              {seatsState === "error" && (
                <div className="grid place-items-center py-16 text-center text-white">
                  <p className="max-w-md text-white/80">{seatError}</p>
                  <Button className="mt-4 rounded-full" onClick={() => { setSeatsState("loading"); loadSeats() }}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button>
                </div>
              )}
              {seatsState === "ready" && <SeatMap event={event} taken={taken} selected={selected} onToggle={toggle} readOnly={locked} />}
            </div>
          )}

          {step === 2 && (
            <div className="glass animate-fade-up space-y-7 rounded-3xl p-6 sm:p-8">
              <div>
                <h2 className="font-display text-2xl font-bold">Attendee</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={locked} maxLength={80} autoComplete="name" className="h-12 rounded-xl" aria-invalid={!!errors["attendee.fullName"]} />
                    {errors["attendee.fullName"] && <p className="text-sm text-destructive">{errors["attendee.fullName"]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone <span className="text-muted-foreground">(optional)</span></Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={locked} inputMode="tel" maxLength={20} autoComplete="tel" placeholder="+91 98765 43210" className="h-12 rounded-xl" aria-invalid={!!errors["attendee.phone"]} />
                    {errors["attendee.phone"] && <p className="text-sm text-destructive">{errors["attendee.phone"]}</p>}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Tickets are sent to {user?.email}. We collect the minimum needed.</p>
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">Payment</h2>
                <div className="mt-4"><PaymentMethods value={method} onChange={setMethod} /></div>
              </div>
              <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" /><span><b className="text-foreground">Demo payment gateway.</b> No real money moves. Your booking is confirmed only when the server verifies a signed payment event, just like a production gateway.</span></p>
                <label className="mt-3 flex cursor-pointer items-center gap-3"><Switch checked={simulateFail} onCheckedChange={setSimulateFail} /><span>Simulate a declined payment (to see the retry flow)</span></label>
              </div>
              <Button className="btn-glow h-12 w-full rounded-full text-base" onClick={pay} disabled={busy}>
                {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</> : <><Lock className="mr-2 h-4 w-4" />Pay {formatINR(total)}</>}
              </Button>
            </div>
          )}
        </section>

        {/* RIGHT: date / time / type */}
        <aside className="order-3 grid grid-cols-2 gap-5 text-sm lg:block lg:space-y-7">
          <div>
            <div className="mb-2 text-xs text-muted-foreground">Date:</div>
            <div className="inline-block rounded-md border px-5 py-2 text-center leading-none"><div className="font-marquee text-4xl">{d.day}</div><div className="mt-1 text-xs tracking-widest">{d.month}</div></div>
          </div>
          <div><div className="mb-1 text-xs text-muted-foreground">Time:</div><div className="font-display text-lg font-semibold">{event.time}</div></div>
          <div><div className="mb-1 text-xs text-muted-foreground">Type:</div><div className="font-marquee text-2xl uppercase tracking-wide">{formatOf(event)}</div></div>
          <div><div className="mb-1 text-xs text-muted-foreground">Venue:</div><div className="font-medium">{event.venue}, {event.city}</div></div>
          <div><div className="mb-1 text-xs text-muted-foreground">Seats left:</div><div className="font-display text-lg font-semibold tabular-nums">{seatsState === "ready" ? left : "…"}</div></div>
          <div className="text-xs text-muted-foreground">{formatDate(event.startsAt, { weekday: "long" })}</div>
        </aside>
      </div>
    </div>
  )
}
