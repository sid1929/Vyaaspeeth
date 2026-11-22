import Link from "next/link"
import type { ReactNode } from "react"
import { Poster } from "@/components/poster"
import { Quote } from "lucide-react"

/** Split-screen layout shared by sign in / sign up. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="container grid min-h-[calc(100vh-4rem)] items-center gap-12 py-12 lg:grid-cols-2">
      <div className="relative mx-auto hidden h-[560px] w-full max-w-md lg:block" aria-hidden="true">
        {["1", "4", "7"].map((id, i) => (
          <Poster key={id} id={id} className="absolute aspect-[3/4] w-56 animate-float rounded-3xl shadow-2xl ring-1 ring-white/10"
            style={{ top: i * 110, left: i === 1 ? "auto" : i * 20, right: i === 1 ? 0 : "auto", animationDelay: `${i * -2}s`, ["--r" as string]: `${[-7, 6, -3][i]}deg` }} />
        ))}
        <div className="glass absolute -bottom-2 left-0 right-0 rounded-2xl p-5 text-sm">
          <Quote className="mb-2 h-5 w-5 text-primary" />
          <p className="font-display text-base font-semibold">Booked in under a minute, and the ticket was in my pocket before the interval.</p>
          <p className="mt-1 text-xs text-muted-foreground">An imaginary delighted customer</p>
        </div>
      </div>
      <div className="glass mx-auto w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h1 className="font-display text-3xl font-extrabold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        <Link href="/" className="sr-only">Home</Link>
      </div>
    </div>
  )
}
