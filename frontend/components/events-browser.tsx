"use client"
import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { LayoutGrid, List, Search, SearchX, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { EventCard } from "@/components/event-card"
import { ScheduleRow } from "@/components/schedule-row"
import { CATEGORIES, EVENTS, dateKey, dayParts, isSoldOut, minPrice } from "@/lib/events"
import { cn } from "@/lib/utils"

const SORTS = { soon: "Soonest", "price-low": "Price: low to high", "price-high": "Price: high to low", rating: "Top rated" } as const
type Sort = keyof typeof SORTS
const DATES = Array.from(new Map(EVENTS.map((e) => [dateKey(e.startsAt), e.startsAt])).entries()).sort(([a], [b]) => a.localeCompare(b))
const CITIES = ["All cities", ...Array.from(new Set(EVENTS.map((e) => e.city))).sort()]

export function EventsBrowser() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const q = params.get("q") ?? ""
  const cat = params.get("cat") ?? "All"
  const city = params.get("city") ?? "All cities"
  const sort = (params.get("sort") as Sort) in SORTS ? (params.get("sort") as Sort) : "soon"
  const onlyAvail = params.get("avail") === "1"
  const date = params.get("date") ?? ""
  const view = params.get("view") === "grid" ? "grid" : "list"

  // The URL is the single source of truth, so filters are shareable and survive refresh/back.
  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) (v === null || v === "" ? next.delete(k) : next.set(k, v))
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false })
  }

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let list = EVENTS.filter((e) =>
      (cat === "All" || e.category === cat) &&
      (city === "All cities" || e.city === city) &&
      (!date || dateKey(e.startsAt) === date) &&
      (!onlyAvail || !isSoldOut(e)) &&
      (!needle || [e.title, e.category, e.venue, e.city, ...e.cast].join(" ").toLowerCase().includes(needle)),
    )
    const by: Record<Sort, (a: (typeof EVENTS)[number], b: (typeof EVENTS)[number]) => number> = {
      soon: (a, b) => +new Date(a.startsAt) - +new Date(b.startsAt),
      "price-low": (a, b) => minPrice(a) - minPrice(b),
      "price-high": (a, b) => minPrice(b) - minPrice(a),
      rating: (a, b) => b.rating - a.rating,
    }
    list = [...list].sort(by[sort])
    return list
  }, [q, cat, city, sort, onlyAvail, date])

  const filtered = q || cat !== "All" || city !== "All cities" || onlyAvail || date

  return (
    <div className="container py-12">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Now showing</p>
        <h1 className="mt-2 font-marquee text-6xl uppercase tracking-wide sm:text-7xl">Shows &amp; schedule</h1>
      </div>

      {/* date strip */}
      <div className="-mx-1 mb-5 flex gap-3 overflow-x-auto px-1 pb-2" role="tablist" aria-label="Date">
        <button role="tab" aria-selected={!date} onClick={() => set({ date: null })} className={cn("shrink-0 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all", !date ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-card/50 text-muted-foreground hover:border-primary/60")}>All dates</button>
        {DATES.map(([key, iso]) => {
          const p = dayParts(iso), on = date === key
          return (
            <button key={key} role="tab" aria-selected={on} onClick={() => set({ date: on ? null : key })} className={cn("shrink-0 rounded-xl border px-4 py-2 text-center leading-none transition-all", on ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-card/50 hover:border-primary/60")}>
              <div className="text-[10px] uppercase tracking-widest opacity-70">{p.weekday}</div>
              <div className="my-1 font-marquee text-3xl">{p.day}</div>
              <div className="text-[10px] tracking-widest opacity-70">{p.month}</div>
            </button>
          )
        })}
      </div>

      <div className="glass sticky top-[4.5rem] z-30 mb-8 space-y-4 rounded-3xl p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => set({ q: e.target.value })} placeholder="Search by event, artist, venue or city…" className="h-11 rounded-full pl-11 pr-10" aria-label="Search events" maxLength={80} />
            {q && <button onClick={() => set({ q: null })} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground" aria-label="Clear search"><X className="h-4 w-4" /></button>}
          </div>
          <select value={city} onChange={(e) => set({ city: e.target.value === "All cities" ? null : e.target.value })} className="h-11 rounded-full border bg-background px-4 text-sm" aria-label="City">
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={(e) => set({ sort: e.target.value === "soon" ? null : e.target.value })} className="h-11 rounded-full border bg-background px-4 text-sm" aria-label="Sort by">
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Category">
            {["All", ...CATEGORIES.map((c) => c.name)].map((name) => {
              const meta = CATEGORIES.find((c) => c.name === name)
              const active = cat === name
              return (
                <button key={name} role="tab" aria-selected={active} onClick={() => set({ cat: name === "All" ? null : name })}
                  className={cn("shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all", active ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-background/50 text-muted-foreground hover:border-primary/60 hover:text-foreground")}>
                  {meta?.emoji} {name}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex rounded-full border p-0.5" role="group" aria-label="Layout">
              <button onClick={() => set({ view: null })} aria-pressed={view === "list"} aria-label="List view" className={cn("grid h-8 w-8 place-items-center rounded-full", view === "list" && "bg-primary text-primary-foreground")}><List className="h-4 w-4" /></button>
              <button onClick={() => set({ view: "grid" })} aria-pressed={view === "grid"} aria-label="Grid view" className={cn("grid h-8 w-8 place-items-center rounded-full", view === "grid" && "bg-primary text-primary-foreground")}><LayoutGrid className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-2">
            <Switch id="avail" checked={onlyAvail} onCheckedChange={(v) => set({ avail: v ? "1" : null })} />
            <Label htmlFor="avail" className="cursor-pointer text-sm">Available only</Label>
            </div>
          </div>
        </div>
      </div>

      <p className="mb-5 text-sm text-muted-foreground" aria-live="polite">{results.length} {results.length === 1 ? "event" : "events"}{filtered ? " match your filters" : ""}</p>

      {results.length && view === "list" ? (
        <div className="space-y-5">
          {results.map((e, i) => <div key={e.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}><ScheduleRow event={e} /></div>)}
        </div>
      ) : results.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((e, i) => <div key={e.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}><EventCard event={e} /></div>)}
        </div>
      ) : (
        <div className="glass grid place-items-center rounded-3xl px-6 py-20 text-center">
          <SearchX className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl font-bold">No shows match that</h2>
          <p className="mt-1 text-muted-foreground">Try a different search or clear your filters.</p>
          <Button className="mt-6 rounded-full" onClick={() => router.replace(pathname, { scroll: false })}>Clear filters</Button>
        </div>
      )}
    </div>
  )
}
