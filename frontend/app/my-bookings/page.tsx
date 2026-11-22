"use client"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarPlus, Loader2, Lock, RefreshCw, Ticket, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RequireAuth } from "@/lib/auth"
import { ApiError, api, type Booking, type PaymentMethod } from "@/lib/api"
import { formatINR } from "@/lib/events"
import { downloadCalendar } from "@/lib/ics"
import { TicketView } from "@/components/ticket-view"
import { PaymentMethods } from "@/components/payment-methods"
import { HoldTimer } from "@/components/hold-timer"
import { Reveal } from "@/components/reveal"
import { cn } from "@/lib/utils"

const TABS = ["All", "Upcoming", "Pending", "Past & cancelled"] as const
type Tab = (typeof TABS)[number]

function Bookings() {
  const [items, setItems] = useState<Booking[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("All")
  const [cancelRef, setCancelRef] = useState<string | null>(null)
  const [payRef, setPayRef] = useState<Booking | null>(null)
  const [method, setMethod] = useState<PaymentMethod>("UPI")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try { setItems((await api.bookings()).bookings) } catch (e) { setError(e instanceof ApiError ? e.message : "Could not load bookings"); setItems([]) }
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const now = Date.now()
    return (items ?? []).filter((b) => {
      if (tab === "Upcoming") return b.status === "Confirmed" && new Date(b.eventStartsAt).getTime() > now
      if (tab === "Pending") return b.status === "Pending"
      if (tab === "Past & cancelled") return b.status === "Cancelled" || b.status === "Expired" || (b.status === "Confirmed" && new Date(b.eventStartsAt).getTime() <= now)
      return true
    })
  }, [items, tab])

  const replace = (b: Booking) => setItems((xs) => (xs ?? []).map((x) => (x.bookingReference === b.bookingReference ? b : x)))

  const doCancel = async () => {
    if (!cancelRef) return
    setBusy(true)
    try { const r = await api.cancel(cancelRef); replace(r.booking); toast.success(r.message) }
    catch (e) { toast.error(e instanceof ApiError ? e.message : "Could not cancel"); load() }
    finally { setBusy(false); setCancelRef(null) }
  }
  const doPay = async () => {
    if (!payRef) return
    setBusy(true)
    try {
      const r = await api.pay({ bookingReference: payRef.bookingReference, method })
      replace(r.booking); toast.success("Payment confirmed. See you there! 🎉"); setPayRef(null)
    } catch (e) { toast.error(e instanceof ApiError ? e.message : "Payment failed"); load() }
    finally { setBusy(false) }
  }

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Your tickets</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold">My bookings</h1>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-1" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all", tab === t ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-background/50 text-muted-foreground hover:text-foreground")}>{t}</button>
        ))}
      </div>

      {items === null ? (
        <div className="space-y-6">{[0, 1].map((i) => <div key={i} className="skeleton h-72" />)}</div>
      ) : error ? (
        <div className="glass rounded-3xl p-10 text-center"><p className="text-destructive">{error}</p><Button className="mt-4 rounded-full" onClick={load}>Try again</Button></div>
      ) : filtered.length === 0 ? (
        <div className="glass grid place-items-center rounded-3xl px-6 py-20 text-center">
          <Ticket className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl font-bold">{tab === "All" ? "No bookings yet" : "Nothing here"}</h2>
          <p className="mt-1 text-muted-foreground">{tab === "All" ? "Your tickets will show up here after you book." : "Try another tab."}</p>
          <Button asChild className="btn-glow mt-6 rounded-full px-8"><Link href="/events">Find a show</Link></Button>
        </div>
      ) : (
        <div className="space-y-8">
          {filtered.map((b, i) => (
            <Reveal key={b.bookingReference} delay={Math.min(i, 3) * 80}>
              <TicketView booking={b} />
              <div className="mt-3 flex flex-wrap items-center gap-2 px-2">
                {b.status === "Pending" && (<>
                  <Button className="btn-glow rounded-full" onClick={() => { setMethod("UPI"); setPayRef(b) }}><Lock className="mr-2 h-4 w-4" />Pay {formatINR(b.total)}</Button>
                  <HoldTimer expiresAt={b.expiresAt} onExpire={load} />
                </>)}
                {b.status === "Confirmed" && <Button variant="outline" className="rounded-full" onClick={() => downloadCalendar(b)}><CalendarPlus className="mr-2 h-4 w-4" />Add to calendar</Button>}
                {(b.status === "Pending" || b.status === "Confirmed") && <Button variant="ghost" className="rounded-full text-destructive hover:text-destructive" onClick={() => setCancelRef(b.bookingReference)}><XCircle className="mr-2 h-4 w-4" />Cancel</Button>}
                {b.paymentStatus === "Refunded" && <span className="text-sm text-muted-foreground">Refund initiated (demo)</span>}
                {b.paymentStatus === "Failed" && b.status === "Pending" && <span className="text-sm text-destructive">Last payment attempt failed</span>}
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <AlertDialog open={!!cancelRef} onOpenChange={(o) => !o && setCancelRef(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Cancel this booking?</AlertDialogTitle><AlertDialogDescription>Confirmed bookings can be cancelled up to 24 hours before the event and are refunded. This can&apos;t be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep booking</AlertDialogCancel><AlertDialogAction onClick={doCancel} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, cancel"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!payRef} onOpenChange={(o) => !o && setPayRef(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Complete payment</DialogTitle><DialogDescription>{payRef?.eventTitle} · {payRef && formatINR(payRef.total)}. Demo gateway, no real money.</DialogDescription></DialogHeader>
          <PaymentMethods value={method} onChange={setMethod} />
          <DialogFooter><Button className="btn-glow w-full rounded-full" disabled={busy} onClick={doPay}>{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</> : `Pay ${payRef ? formatINR(payRef.total) : ""}`}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function MyBookingsPage() {
  return <RequireAuth><Bookings /></RequireAuth>
}
