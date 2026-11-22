import Link from "next/link"
import type { Metadata } from "next"
import { ArrowUpRight } from "lucide-react"
import { Reveal } from "@/components/reveal"
import { CATEGORIES, EVENTS } from "@/lib/events"

export const metadata: Metadata = { title: "Categories", description: "Browse events by category: theatre, comedy, classical and modern music, dance, art and culture." }

export default function CategoriesPage() {
  return (
    <div className="container py-12">
      <Reveal className="mb-10">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Browse</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">Pick your stage</h1>
      </Reveal>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c, i) => {
          const shows = EVENTS.filter((e) => e.category === c.name)
          return (
            <Reveal key={c.name} delay={i * 70}>
              <Link href={`/events?cat=${encodeURIComponent(c.name)}`} className="group relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-3xl p-7 text-white transition-transform duration-500 hover:-translate-y-1.5" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
                <div className="poster-pattern absolute inset-0" />
                <span className="absolute -bottom-6 -right-3 text-[9rem] leading-none opacity-90 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110">{c.emoji}</span>
                <span className="relative grid h-11 w-11 place-items-center rounded-full bg-white/20 backdrop-blur transition-transform group-hover:rotate-45"><ArrowUpRight className="h-5 w-5" /></span>
                <div className="relative">
                  <h2 className="font-display text-3xl font-extrabold">{c.name}</h2>
                  <p className="mt-1 text-white/85">{c.blurb}</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-widest">{shows.length} {shows.length === 1 ? "show" : "shows"}</p>
                </div>
              </Link>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}
