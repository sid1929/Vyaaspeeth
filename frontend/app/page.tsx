import Link from "next/link"
import { ArrowRight, BadgeCheck, KeyRound, Lock, MousePointerClick, QrCode, Search, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/event-card"
import { Reveal } from "@/components/reveal"
import { Marquee } from "@/components/marquee"
import { CountUp } from "@/components/count-up"
import { RotatingWords } from "@/components/rotating-words"
import { FeaturedNext } from "@/components/featured-next"
import { Poster } from "@/components/poster"
import { SearchButton } from "@/components/search-button"
import { CATEGORIES, EVENTS, formatINR, minPrice } from "@/lib/events"

const cities = new Set(EVENTS.map((e) => e.city)).size
const avgRating = (EVENTS.reduce((s, e) => s + e.rating, 0) / EVENTS.length).toFixed(1)

const STEPS = [
  { icon: MousePointerClick, title: "Pick your show", text: "Browse by category, city or vibe. Press ⌘K to jump straight to any event." },
  { icon: Wallet, title: "Hold & pay securely", text: "Your seats are held for 15 minutes while payment is verified by our server." },
  { icon: QrCode, title: "Get your e-ticket", text: "A QR ticket lands in My bookings the moment payment is confirmed." },
]
const TRUST = [
  { icon: BadgeCheck, title: "Server-priced tickets", text: "Totals are calculated on our server from trusted event data, so a tampered request can't change what you pay." },
  { icon: Lock, title: "Signed payments", text: "Bookings confirm only when a cryptographically signed payment event arrives, never from a button in your browser." },
  { icon: KeyRound, title: "Sessions that expire", text: "Short-lived tokens, instant sign-out everywhere and rate-limited sign-in protect your account." },
]

export default function Homepage() {
  const hot = EVENTS.filter((e) => e.trending).slice(0, 4)
  const stack = [EVENTS[0], EVENTS[6], EVENTS[3]]
  return (
    <>
      {/* HERO */}
      <section className="container relative grid items-center gap-12 pb-20 pt-14 lg:grid-cols-[1.1fr_.9fr] lg:pt-24">
        <div>
          <Reveal>
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
              {EVENTS.length} live shows across {cities} cities, on sale now
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Find your next <br className="hidden sm:block" /><RotatingWords words={["night out", "standing ovation", "favourite laugh", "encore"]} />
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">Theatre, comedy, classical and live music, from Mumbai&apos;s stages to Bengaluru&apos;s open-air nights. Book in seconds with checkout that&apos;s secure by design.</p>
          </Reveal>
          <Reveal delay={240} className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="btn-glow h-12 rounded-full px-8 text-base"><Link href="/events">Explore events <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <SearchButton className="glass flex h-12 items-center gap-2 rounded-full px-6 text-sm font-medium transition hover:border-primary">
              <Search className="h-4 w-4" />Search <kbd className="rounded border bg-background/60 px-1.5 text-[10px]">⌘K</kbd>
            </SearchButton>
          </Reveal>
          <Reveal delay={320} className="mt-12 grid max-w-lg grid-cols-3 gap-6">
            {[[EVENTS.length, "", "Live shows"], [cities, "", "Cities"], [EVENTS.reduce((s, e) => s + e.reviewCount, 0), "+", "Reviews"]].map(([n, suffix, label]) => (
              <div key={label as string}>
                <div className="font-display text-3xl font-extrabold"><CountUp to={n as number} suffix={suffix as string} /></div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </Reveal>
        </div>

        {/* floating poster stack */}
        <div className="relative mx-auto hidden h-[520px] w-full max-w-md lg:block" aria-hidden="true">
          {stack.map((e, i) => (
            <Link key={e.id} href={`/events/${e.id}`} tabIndex={-1} className="absolute w-64 animate-float rounded-3xl shadow-2xl ring-1 ring-white/10 transition-transform duration-500 hover:scale-105"
              style={{ top: i * 120, zIndex: 30 - i * 10, left: i % 2 ? "auto" : 0, right: i % 2 ? 0 : "auto", ["--r" as string]: `${[-6, 5, -3][i]}deg`, animationDelay: `${i * -2}s`, transform: `rotate(${[-6, 5, -3][i]}deg)` }}>
              <Poster id={e.id} className="aspect-[3/4] rounded-3xl">
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-semibold uppercase tracking-widest opacity-80">{e.category}</div>
                  <div className="font-display text-lg font-bold leading-tight">{e.title}</div>
                  <div className="mt-1 text-sm opacity-90">from {formatINR(minPrice(e))}</div>
                </div>
              </Poster>
            </Link>
          ))}
        </div>
      </section>

      <Marquee items={CATEGORIES.map((c) => `${c.emoji} ${c.name}`)} />

      {/* NEXT UP */}
      <section className="container pt-20">
        <Reveal><FeaturedNext /></Reveal>
      </section>

      {/* TRENDING */}
      <section className="container pt-24">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">Trending now</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold">Everyone&apos;s booking these</h2>
          </div>
          <Button asChild variant="ghost" className="rounded-full"><Link href="/events">View all <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {hot.map((e, i) => <Reveal key={e.id} delay={i * 90}><EventCard event={e} /></Reveal>)}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container pt-24">
        <Reveal className="mb-10">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Browse</p>
          <h2 className="mt-2 font-display text-4xl font-extrabold">Whatever your mood</h2>
        </Reveal>
        <div className="grid auto-rows-[160px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.name} delay={i * 70} className={i === 0 || i === 3 ? "lg:col-span-2" : ""}>
              <Link href={`/events?cat=${encodeURIComponent(c.name)}`} className="group relative block h-full overflow-hidden rounded-3xl p-6 text-white transition-transform duration-500 hover:-translate-y-1" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
                <div className="poster-pattern absolute inset-0" />
                <span className="absolute -bottom-4 -right-2 text-8xl opacity-90 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-125">{c.emoji}</span>
                <div className="relative">
                  <h3 className="font-display text-2xl font-extrabold">{c.name}</h3>
                  <p className="mt-1 max-w-[70%] text-sm text-white/85">{c.blurb}</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-widest text-white/90">{EVENTS.filter((e) => e.category === c.name).length} shows →</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container pt-24">
        <Reveal className="mb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">How it works</p>
          <h2 className="mt-2 font-display text-4xl font-extrabold">From curtain-up to QR in three steps</h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 110}>
              <div className="glass relative h-full rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-1">
                <span className="absolute right-6 top-4 font-display text-6xl font-extrabold text-foreground/5">0{i + 1}</span>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary"><s.icon className="h-6 w-6" /></span>
                <h3 className="mt-5 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-muted-foreground">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TRUST */}
      <section className="container pt-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border bg-gradient-to-br from-primary/10 via-card to-violet/10 p-8 md:p-14">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-widest text-primary">Secure by design</p>
              <h2 className="mt-2 font-display text-4xl font-extrabold">Your seats and your data, protected.</h2>
              <p className="mt-3 text-muted-foreground">Security isn&apos;t a footnote here. It shapes how bookings, prices and payments work.</p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {TRUST.map((t) => (
                <div key={t.title} className="space-y-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-background/70 text-primary shadow"><t.icon className="h-5 w-5" /></span>
                  <h3 className="font-display text-lg font-bold">{t.title}</h3>
                  <p className="text-sm text-muted-foreground">{t.text}</p>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-10 rounded-full"><Link href="/about">See how it works <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="container py-24 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-extrabold sm:text-5xl">The lights are going down. <span className="text-gradient">Grab your seat.</span></h2>
          <Button asChild size="lg" className="btn-glow mt-8 h-12 rounded-full px-10 text-base"><Link href="/events">Book now</Link></Button>
          <p className="mt-4 text-sm text-muted-foreground">Average rating {avgRating} ★ across all shows</p>
        </Reveal>
      </section>
    </>
  )
}
