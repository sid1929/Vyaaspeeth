"use client"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock, Heart, MapPin, Share2, ShieldCheck, Star, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Poster } from "@/components/poster"
import { Countdown } from "@/components/countdown"
import { EventCard } from "@/components/event-card"
import { Reveal } from "@/components/reveal"
import { EVENTS, formatDate, formatINR, formatOf, isSoldOut, minPrice, tierSeatCount, type EventItem } from "@/lib/events"
import { useWishlist } from "@/lib/wishlist"
import { cn } from "@/lib/utils"

export function EventDetail({ event }: { event: EventItem }) {
  const { has, toggle } = useWishlist()
  const sold = isSoldOut(event)
  const related = EVENTS.filter((e) => e.id !== event.id).sort((a, b) => Number(b.category === event.category) - Number(a.category === event.category)).slice(0, 3)

  const share = async () => {
    const data = { title: event.title, text: `Check out ${event.title} on Vyaaspeeth`, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(data)
      else { await navigator.clipboard.writeText(data.url); toast.success("Link copied to clipboard") }
    } catch { /* user dismissed the share sheet */ }
  }

  return (
    <div>
      <div className="container pt-6">
        <Button asChild variant="ghost" className="rounded-full"><Link href="/events"><ArrowLeft className="mr-2 h-4 w-4" />All events</Link></Button>
      </div>

      <section className="container mt-4">
        <Poster id={event.id} big className="h-[300px] rounded-[2rem] sm:h-[400px]">
          <div className="absolute right-5 top-5 flex gap-2">
            <button onClick={() => toggle(event.id)} aria-pressed={has(event.id)} aria-label="Save event" className="grid h-11 w-11 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:scale-110">
              <Heart className={cn("h-5 w-5", has(event.id) && "fill-primary text-primary animate-pop")} />
            </button>
            <button onClick={share} aria-label="Share event" className="grid h-11 w-11 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:scale-110"><Share2 className="h-5 w-5" /></button>
          </div>
          <div className="absolute bottom-6 left-6 right-6 text-white sm:bottom-10 sm:left-10">
            <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur">{event.category}</span>
            <h1 className="mt-3 max-w-3xl font-display text-3xl font-extrabold leading-tight drop-shadow sm:text-5xl">{event.title}</h1>
          </div>
        </Poster>
      </section>

      <div className="container mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          <Reveal className="flex flex-wrap gap-3">
            {[
              [CalendarDays, `${formatDate(event.startsAt, { weekday: "short", day: "numeric", month: "long", year: "numeric" })}`],
              [Clock, `${event.time} · ${event.duration}`],
              [MapPin, `${event.venue}, ${event.city}`],
              [Star, `${event.rating} (${event.reviewCount.toLocaleString("en-IN")} reviews)`],
            ].map(([Icon, text], i) => {
              const I = Icon as typeof Star
              return <span key={i} className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm"><I className={cn("h-4 w-4 text-primary", i === 3 && "fill-gold text-gold")} />{text as string}</span>
            })}
          </Reveal>

          <Reveal><Countdown to={event.startsAt} /></Reveal>

          <Reveal>
            <h2 className="font-display text-2xl font-bold">About this event</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{event.longDescription}</p>
          </Reveal>

          <Reveal>
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><Users className="h-5 w-5 text-primary" />Featuring</h2>
            <div className="mt-4 flex flex-wrap gap-2">{event.cast.map((c) => <span key={c} className="rounded-full border bg-card px-4 py-2 text-sm font-medium">{c}</span>)}</div>
          </Reveal>

          <Reveal>
            <h2 className="font-display text-2xl font-bold">Good to know</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {event.features.map((f) => <li key={f} className="flex items-center gap-3 text-sm"><span className="grid h-6 w-6 place-items-center rounded-full bg-success/15 text-success"><Check className="h-3.5 w-3.5" /></span>{f}</li>)}
            </ul>
          </Reveal>
        </div>

        {/* booking panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="glass rounded-3xl p-6 shadow-2xl">
            <h2 className="font-display text-xl font-bold">Pick your seats</h2>
            <p className="mt-1 text-sm text-muted-foreground">{formatOf(event)} · choose exact seats on the live map.</p>
            <ul className="mt-4 space-y-2.5">
              {event.tiers.map((t) => (
                <li key={t.name} className={cn("flex items-center justify-between rounded-2xl border p-4", !t.available && "opacity-50")}>
                  <span>
                    <span className="block font-display font-bold">{t.name}</span>
                    <span className="text-xs text-muted-foreground">{t.available ? `${tierSeatCount(event, t.name)} seats · rows ${event.hall.tiers[t.name][0]}–${event.hall.tiers[t.name].at(-1)}` : "Sold out"}</span>
                  </span>
                  <span className="font-display text-xl font-extrabold">{formatINR(t.price)}</span>
                </li>
              ))}
            </ul>
            <Button asChild={!sold} size="lg" disabled={sold} className="btn-glow mt-5 h-12 w-full rounded-full text-base">
              {sold ? <span>Sold out</span> : <Link href={`/booking/${event.id}`}>Select seats from {formatINR(minPrice(event))} <ArrowRight className="ml-2 h-4 w-4" /></Link>}
            </Button>
            <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />Seats are held for 15 minutes while you pay. Prices are confirmed by our server.</p>
          </div>
        </aside>
      </div>

      <section className="container mt-24">
        <h2 className="mb-8 font-display text-3xl font-extrabold">You might also like</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{related.map((e) => <EventCard key={e.id} event={e} />)}</div>
      </section>
    </div>
  )
}
