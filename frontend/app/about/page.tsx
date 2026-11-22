import type { Metadata } from "next"
import { Check, KeyRound, Lock, Scale, ScrollText, ShieldAlert, ShieldCheck, Ticket, Timer } from "lucide-react"
import { Reveal } from "@/components/reveal"
import { CountUp } from "@/components/count-up"
import { EVENTS, CATEGORIES } from "@/lib/events"

export const metadata: Metadata = { title: "About & security", description: "How Vyaaspeeth keeps bookings, prices and payments secure." }

const CONTROLS = [
  { icon: Lock, title: "Password hashing", text: "bcrypt with 12 salt rounds. Plain-text passwords are never stored, logged or returned." },
  { icon: KeyRound, title: "Signed, expiring sessions", text: "HS256 JWTs pinned to one algorithm, 8-hour expiry, and server-side invalidation on sign-out." },
  { icon: Scale, title: "Server-trusted pricing", text: "Clients send only an event and seat ids. Each seat's tier, price, the fee and the total are computed on the server." },
  { icon: Ticket, title: "No double booking", text: "Every held or sold seat is a database row with a UNIQUE index, so two people can never get the same seat, even at the same millisecond." },
  { icon: ShieldCheck, title: "Object-level authorization", text: "Every booking query includes the owner. Someone else's reference looks identical to a missing one (anti-IDOR)." },
  { icon: Timer, title: "Payment state machine", text: "Bookings are 15-minute seat holds. Only a signed, in-date, amount-matching payment event can confirm one." },
  { icon: ShieldAlert, title: "Abuse protection", text: "Rate limits on sign-in (per account + IP), booking and contact. Generic errors prevent account enumeration." },
  { icon: ScrollText, title: "Strict validation", text: "Every request is schema-validated; unknown fields are rejected, which blocks parameter tampering and NoSQL operator injection." },
  { icon: Check, title: "Hardened edges", text: "Helmet headers, an exact CORS allow-list, 100 KB body limits, CSP and frame protection on the web app." },
]

export default function AboutPage() {
  return (
    <div className="container max-w-5xl py-12">
      <Reveal>
        <p className="text-sm font-bold uppercase tracking-widest text-primary">About</p>
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold leading-tight sm:text-6xl">Live culture, <span className="text-gradient">booked with confidence.</span></h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">Vyaaspeeth brings theatre, comedy, music, dance and art into one beautifully simple booking experience, and treats security as part of the product, not an afterthought.</p>
      </Reveal>

      <Reveal className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[[EVENTS.length, "Live shows"], [CATEGORIES.length, "Categories"], [new Set(EVENTS.map((e) => e.city)).size, "Cities"], [15, "Minute seat holds"]].map(([n, l]) => (
          <div key={l as string} className="glass rounded-3xl p-6 text-center"><div className="font-display text-4xl font-extrabold text-gradient"><CountUp to={n as number} /></div><div className="mt-1 text-sm text-muted-foreground">{l}</div></div>
        ))}
      </Reveal>

      <section className="mt-24">
        <Reveal>
          <h2 className="font-display text-3xl font-extrabold">Security, in plain English</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">These controls are implemented in the API and covered by automated tests, including negative tests for tampering, cross-user access and forged payments.</p>
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {CONTROLS.map((c, i) => (
            <Reveal key={c.title} delay={(i % 2) * 90}>
              <div className="glass flex h-full gap-4 rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary"><c.icon className="h-6 w-6" /></span>
                <div><h3 className="font-display text-lg font-bold">{c.title}</h3><p className="mt-1 text-sm text-muted-foreground">{c.text}</p></div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-8">
          <div className="rounded-3xl border border-dashed p-6 text-sm text-muted-foreground">
            <b className="text-foreground">Honest status:</b> this is a portfolio project. Payments use a demo gateway that signs events exactly like a real provider would, but no real money moves. Before production you would add a real payment provider, MFA, a secrets manager, centralised logging and an independent security review.
          </div>
        </Reveal>
      </section>
    </div>
  )
}
