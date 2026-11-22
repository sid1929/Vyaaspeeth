export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items]
  return (
    <div className="relative overflow-hidden border-y bg-card/40 py-4 backdrop-blur [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]" aria-hidden="true">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-display text-lg font-semibold uppercase tracking-[.2em] text-muted-foreground hover:[animation-play-state:paused]">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10">{t}<span className="text-primary">✦</span></span>
        ))}
      </div>
    </div>
  )
}
