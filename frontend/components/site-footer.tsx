import Link from "next/link"
import { Lock, ShieldCheck, Zap } from "lucide-react"
import { Logo } from "@/components/site-header"

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-card/40 backdrop-blur">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">Discover live theatre, comedy, music and culture, and book your seat in seconds. Built with security in mind.</p>
        </div>
        <FooterCol title="Explore" links={[["/events", "All events"], ["/categories", "Categories"], ["/my-bookings", "My bookings"]]} />
        <FooterCol title="Company" links={[["/about", "About & security"], ["/contact", "Contact"], ["/feedback", "Feedback"]]} />
        <div className="space-y-3 text-sm">
          <h4 className="font-display font-bold">How we protect you</h4>
          <p className="flex gap-2 text-muted-foreground"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Passwords hashed with bcrypt, sessions expire</p>
          <p className="flex gap-2 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Prices calculated on the server, never your browser</p>
          <p className="flex gap-2 text-muted-foreground"><Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Payments confirmed only by signed provider events</p>
        </div>
      </div>
      <div className="border-t py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Vyaaspeeth · Portfolio project · Demo payments only, no real money is ever charged.
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="space-y-3 text-sm">
      <h4 className="font-display font-bold">{title}</h4>
      <ul className="space-y-2">
        {links.map(([href, label]) => <li key={href}><Link href={href} className="text-muted-foreground transition-colors hover:text-primary">{label}</Link></li>)}
      </ul>
    </div>
  )
}
