import { poster } from "@/lib/events"
import { cn } from "@/lib/utils"

/** Gradient + emoji poster art generated in CSS: sharp at any size, no image requests. */
export function Poster({ id, className, big = false, style, children }: { id: string; className?: string; big?: boolean; style?: React.CSSProperties; children?: React.ReactNode }) {
  const p = poster(id)
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})`, ...style }} aria-hidden="true">
      <div className="poster-pattern absolute inset-0" />
      <div className="absolute -top-1/3 -right-1/4 h-[90%] w-[90%] rounded-full bg-white/25 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      <span className={cn("absolute select-none drop-shadow-[0_10px_24px_rgba(0,0,0,.45)] animate-float", big ? "right-[8%] top-[12%] text-[7.5rem] sm:text-[10rem]" : "right-4 top-3 text-6xl")} style={{ ["--r" as string]: "-8deg" }}>
        {p.emoji}
      </span>
      {children}
    </div>
  )
}
