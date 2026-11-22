"use client"
import Link from "next/link"
import { Flame, Heart, MapPin, ArrowUpRight } from "lucide-react"
import { TiltCard } from "@/components/tilt-card"
import { Poster } from "@/components/poster"
import { dayParts, formatINR, isSoldOut, minPrice, type EventItem } from "@/lib/events"
import { useWishlist } from "@/lib/wishlist"
import { cn } from "@/lib/utils"

export function EventCard({ event }: { event: EventItem }) {
  const { has, toggle } = useWishlist()
  const saved = has(event.id)
  const d = dayParts(event.startsAt)
  const sold = isSoldOut(event)
  return (
    <TiltCard className="group rounded-3xl">
      <div className="relative overflow-hidden rounded-3xl border bg-card shadow-sm transition-shadow group-hover:shadow-2xl group-hover:shadow-primary/20">
        <Link href={`/events/${event.id}`} className="block" aria-label={`${event.title}, ${event.category}`}>
          <Poster id={event.id} className="aspect-[4/3]">
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur">{event.category}</span>
              {event.trending && !sold && (
                <span className="flex items-center gap-1 rounded-full bg-gold/90 px-2.5 py-1 text-xs font-semibold text-black"><Flame className="h-3 w-3" />Hot</span>
              )}
            </div>
            <div className="absolute bottom-4 left-4 rounded-2xl bg-white/90 px-3 py-1.5 text-center leading-none text-black shadow-lg backdrop-blur dark:bg-black/60 dark:text-white">
              <div className="text-xl font-extrabold font-display">{d.day}</div>
              <div className="text-[10px] font-semibold tracking-widest opacity-70">{d.month}</div>
            </div>
            {sold && <div className="absolute inset-0 grid place-items-center bg-black/60 text-lg font-bold tracking-widest text-white">SOLD OUT</div>}
          </Poster>
          <div className="space-y-3 p-5">
            <h3 className="line-clamp-2 min-h-[3.2rem] font-display text-lg font-bold leading-snug">{event.title}</h3>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{event.venue}, {event.city}</span></p>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">From</div>
                <div className="font-display text-xl font-extrabold">{sold ? "—" : formatINR(minPrice(event))}</div>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:rotate-45 group-hover:scale-110">
                <ArrowUpRight className="h-5 w-5" />
              </span>
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => toggle(event.id)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved events" : "Save event"}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:scale-110"
        >
          <Heart className={cn("h-4 w-4 transition", saved && "fill-primary text-primary animate-pop")} />
        </button>
      </div>
    </TiltCard>
  )
}
