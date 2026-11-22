"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, CalendarDays, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Countdown } from "@/components/countdown"
import { Poster } from "@/components/poster"
import { EVENTS, formatDate, formatINR, minPrice, type EventItem } from "@/lib/events"

const upcoming = (now: number): EventItem | undefined =>
  [...EVENTS].filter((e) => new Date(e.startsAt).getTime() > now).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0]

/** Spotlight on the soonest upcoming show, with a live countdown. */
export function FeaturedNext() {
  const [event, setEvent] = useState<EventItem | undefined>(EVENTS[0])
  useEffect(() => setEvent(upcoming(Date.now())), [])
  if (!event) return null
  return (
    <div className="relative overflow-hidden rounded-[2rem] border bg-card shadow-2xl">
      <div className="grid md:grid-cols-2">
        <Poster id={event.id} big className="min-h-[280px] md:min-h-[420px]" />
        <div className="flex flex-col justify-center gap-5 p-8 md:p-12">
          <span className="w-fit rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">Next up</span>
          <h3 className="font-display text-3xl font-extrabold leading-tight md:text-4xl">{event.title}</h3>
          <p className="text-muted-foreground">{event.description}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{formatDate(event.startsAt, { day: "numeric", month: "long", year: "numeric" })} · {event.time}</span>
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{event.venue}, {event.city}</span>
          </div>
          <Countdown to={event.startsAt} />
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <Button asChild size="lg" className="btn-glow rounded-full px-8"><Link href={`/events/${event.id}`}>Get tickets <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <span className="text-sm text-muted-foreground">from <b className="font-display text-lg text-foreground">{formatINR(minPrice(event))}</b></span>
          </div>
        </div>
      </div>
    </div>
  )
}
