"use client"
import Link from "next/link"
import { Clock, Heart, MapPin, Star } from "lucide-react"
import { Poster } from "@/components/poster"
import { Button } from "@/components/ui/button"
import { dayParts, formatDate, formatINR, formatOf, isSoldOut, minPrice, type EventItem } from "@/lib/events"
import { useWishlist } from "@/lib/wishlist"
import { cn } from "@/lib/utils"

/** Cinema-style "now showing" row: portrait poster, details, date/time block and a seat-selection CTA. */
export function ScheduleRow({ event }: { event: EventItem }) {
  const { has, toggle } = useWishlist()
  const d = dayParts(event.startsAt)
  const sold = isSoldOut(event)
  return (
    <article className="group glass relative grid gap-5 overflow-hidden rounded-3xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/10 sm:grid-cols-[120px_1fr_auto] sm:p-5 md:grid-cols-[140px_1fr_auto]">
      <Link href={`/events/${event.id}`} className="block" aria-label={`${event.title} details`}>
        <Poster id={event.id} className="mx-auto aspect-[2/3] w-28 rounded-2xl shadow-xl sm:w-full" />
      </Link>

      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-primary/15 px-2.5 py-1 font-semibold uppercase tracking-wider text-primary">{event.category}</span>
          <span className="rounded-full border px-2.5 py-1 text-muted-foreground">{formatOf(event)}</span>
          {event.trending && !sold && <span className="rounded-full bg-gold/20 px-2.5 py-1 font-semibold text-gold">Trending</span>}
        </div>
        <Link href={`/events/${event.id}`}><h3 className="font-marquee text-4xl uppercase leading-none tracking-wide transition-colors group-hover:text-primary sm:text-5xl">{event.title}</h3></Link>
        <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">{event.description}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" />{event.venue}, {event.city}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" />{event.duration}</span>
          <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-gold text-gold" />{event.rating} ({event.reviewCount.toLocaleString("en-IN")})</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-between">
        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-3">
          <div className="rounded-md border px-4 py-2 text-center leading-none">
            <div className="font-marquee text-3xl">{d.day}</div>
            <div className="mt-0.5 text-[11px] tracking-widest">{d.month}</div>
          </div>
          <div className="text-sm">
            <div className="text-xs text-muted-foreground">{formatDate(event.startsAt, { weekday: "long" })}</div>
            <span className="mt-1 inline-block rounded-md bg-foreground px-3 py-1 font-semibold tabular-nums text-background">{event.time}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right"><div className="text-[11px] uppercase tracking-wider text-muted-foreground">From</div><div className="font-display text-xl font-extrabold">{sold ? "-" : formatINR(minPrice(event))}</div></div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggle(event.id)} aria-pressed={has(event.id)} aria-label="Save event" className="grid h-10 w-10 place-items-center rounded-full border transition hover:border-primary"><Heart className={cn("h-4 w-4", has(event.id) && "fill-primary text-primary")} /></button>
            <Button asChild={!sold} disabled={sold} className="btn-glow rounded-md font-semibold uppercase tracking-wide">
              {sold ? <span>Sold out</span> : <Link href={`/booking/${event.id}`}>Select seats</Link>}
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
