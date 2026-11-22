import type { Metadata } from "next"
import { Clock, Mail, MapPin } from "lucide-react"
import { MessageForm } from "@/components/message-form"
import { Reveal } from "@/components/reveal"

export const metadata: Metadata = { title: "Contact" }

export default function ContactPage() {
  return (
    <div className="container max-w-5xl py-12">
      <Reveal className="mb-10">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Contact</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">Say hello</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">Questions about a booking, a show or a partnership? Send us a note.</p>
      </Reveal>
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <Reveal><MessageForm kind="contact" /></Reveal>
        <Reveal delay={100} className="space-y-4">
          {[[Mail, "Email", "Use the form. We reply within 1–2 working days."], [Clock, "Hours", "Mon–Sat, 10:00–19:00 IST"], [MapPin, "Based in", "India, serving events nationwide"]].map(([Icon, t, d]) => {
            const I = Icon as typeof Mail
            return <div key={t as string} className="glass flex gap-4 rounded-2xl p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary"><I className="h-5 w-5" /></span><div><div className="font-display font-bold">{t as string}</div><div className="text-sm text-muted-foreground">{d as string}</div></div></div>
          })}
        </Reveal>
      </div>
    </div>
  )
}
