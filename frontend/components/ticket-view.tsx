"use client"
import { QRCodeSVG } from "qrcode.react"
import { CalendarDays, MapPin, Ticket, ShieldCheck } from "lucide-react"
import { Poster } from "@/components/poster"
import { formatDate, formatINR, getEvent } from "@/lib/events"
import type { Booking } from "@/lib/api"
import { cn } from "@/lib/utils"

const STATUS: Record<Booking["status"], string> = {
  Confirmed: "bg-success/15 text-success",
  Pending: "bg-gold/20 text-gold",
  Cancelled: "bg-destructive/15 text-destructive",
  Expired: "bg-muted text-muted-foreground",
}

/** A ticket-stub styled booking card. The QR encodes only the booking reference, never personal data. */
export function TicketView({ booking, className }: { booking: Booking; className?: string }) {
  const event = getEvent(booking.eventId)
  const valid = booking.status === "Confirmed"
  return (
    <div className={cn("ticket relative overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-xl", className)} style={{ ["--cut" as string]: "72%" }}>
      <Poster id={booking.eventId} className="h-36">
        <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between">
          <h3 className="line-clamp-2 max-w-[70%] font-display text-xl font-extrabold leading-tight text-white drop-shadow">{booking.eventTitle}</h3>
          <span className={cn("rounded-full px-3 py-1 text-xs font-bold backdrop-blur", STATUS[booking.status])}>{booking.status}</span>
        </div>
      </Poster>
      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="space-y-2.5 text-sm">
          <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{formatDate(booking.eventStartsAt, { weekday: "short", day: "numeric", month: "long", year: "numeric" })}{event ? ` · ${event.time}` : ""}</p>
          {event && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{event.venue}, {event.city}</p>}
          <p className="flex items-center gap-2"><Ticket className="h-4 w-4 shrink-0 text-primary" /><span>Seats <b className="font-mono">{booking.seats.map((x) => x.seat).join(", ")}</b> · <b>{formatINR(booking.total)}</b></span></p>
          <p className="text-xs text-muted-foreground">{Array.from(new Set(booking.seats.map((x) => x.tier))).map((t) => `${booking.seats.filter((x) => x.tier === t).length} × ${t}`).join(" · ")}</p>
          <p className="text-xs text-muted-foreground">Name: {booking.fullName}</p>
        </div>
        <div className="mx-auto text-center">
          <div className={cn("rounded-2xl bg-white p-2.5 transition", !valid && "opacity-25 grayscale")}>
            <QRCodeSVG value={`VYAASPEETH:${booking.bookingReference}`} size={104} level="M" />
          </div>
        </div>
      </div>
      <div className="perforation mx-5" />
      <div className="flex items-center justify-between gap-3 px-5 py-4 text-xs">
        <div>
          <div className="uppercase tracking-widest text-muted-foreground">Booking ref</div>
          <div className="font-mono text-sm font-bold tracking-wider">{booking.bookingReference}</div>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground"><ShieldCheck className="h-4 w-4 text-success" />Server-verified</div>
      </div>
    </div>
  )
}
