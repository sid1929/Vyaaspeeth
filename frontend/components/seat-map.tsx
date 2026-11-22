"use client"
import { memo, useEffect, useRef, useState } from "react"
import { formatINR, seatId, seatTier, type EventItem, type Tier } from "@/lib/events"
import { cn } from "@/lib/utils"

const TIER_STYLE: Record<Tier["name"], string> = {
  Premium: "ring-1 ring-gold/70",
  Standard: "",
  Economy: "opacity-80",
}

type Props = { event: EventItem; taken: Set<string>; selected: string[]; onToggle: (id: string) => void; readOnly?: boolean }

/** Cinema-style seat map: stage on top, rows grouped by price tier, aisle gap, live availability. */
function SeatMapBase({ event, taken, selected, onToggle, readOnly }: Props) {
  const { hall, tiers } = event
  const rows = Object.entries(hall.tiers).flatMap(([tier, rs]) => rs.map((row) => ({ row, tier: tier as Tier["name"] })))
  const tierInfo = (t: Tier["name"]) => tiers.find((x) => x.name === t)
  const cols = Array.from({ length: hall.cols }, (_, i) => i + 1)
  const sel = new Set(selected)

  // Scale the whole map to fit the available width (phones), keeping it centred.
  const wrapRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ scale: 1, height: undefined as number | undefined })
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const inner = innerRef.current
      if (!inner || !el.clientWidth) return
      const scale = Math.min(1, (el.clientWidth - 4) / inner.offsetWidth)
      setFit({ scale, height: inner.offsetHeight * scale })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [event.id])

  return (
    <div>
      {/* stage with light beam */}
      <div className="relative mx-auto mb-10 w-[78%] max-w-[560px]" aria-hidden="true">
        <div className="h-12 bg-gradient-to-b from-white/60 to-white/10 text-center font-marquee text-lg leading-[3rem] tracking-[0.5em] text-black/60 [clip-path:polygon(7%_0,93%_0,100%_100%,0_100%)]">STAGE</div>
        <div className="pointer-events-none absolute inset-x-[4%] top-full h-24 bg-gradient-to-b from-white/15 to-transparent [clip-path:polygon(0_0,100%_0,92%_100%,8%_100%)]" />
      </div>

      <div ref={wrapRef} className="flex items-start justify-center" style={{ height: fit.height }}>
        <div ref={innerRef} className="flex w-max shrink-0 origin-top flex-col items-center gap-[5px]" style={{ transform: `scale(${fit.scale})` }} role="group" aria-label="Seat map">
          {rows.map(({ row, tier }, i) => {
            const startsTier = i === 0 || rows[i - 1].tier !== tier
            const info = tierInfo(tier)
            return (
              <div key={row} className={cn("flex items-center gap-2", startsTier && i !== 0 && "mt-4")}>
                <span className="w-4 text-right font-mono text-[11px] text-white/40">{row}</span>
                <div className="flex gap-[5px]">
                  {cols.map((c) => {
                    const id = seatId(row, c)
                    const unavailable = taken.has(id) || !info?.available
                    const isSel = sel.has(id)
                    const label = `Row ${row}, seat ${c}, ${tier}, ${formatINR(info?.price ?? 0)}, ${isSel ? "selected" : unavailable ? "unavailable" : "available"}`
                    return (
                      <span key={id} className="flex">
                        <button
                          type="button"
                          aria-label={label}
                          aria-pressed={isSel}
                          title={unavailable ? `${id}: not available` : `${id} · ${tier} · ${formatINR(info?.price ?? 0)}`}
                          disabled={(unavailable && !isSel) || readOnly}
                          onClick={() => onToggle(id)}
                          className={cn(
                            "h-[22px] w-[22px] rounded-[5px] transition-all duration-150 sm:h-6 sm:w-6",
                            isSel ? "scale-110 bg-primary shadow-[0_0_14px_hsl(var(--primary)/.9)]"
                              : unavailable ? "cursor-not-allowed bg-white/[.07]"
                              : cn("bg-white/30 hover:-translate-y-0.5 hover:scale-110 hover:bg-white/70", TIER_STYLE[tier]),
                          )}
                        />
                        {c === hall.aisleAfter && <span className="w-4 sm:w-5" />}
                      </span>
                    )
                  })}
                </div>
                <span className="w-4 font-mono text-[11px] text-white/40">{row}</span>
                <span className="ml-1 hidden w-28 text-[11px] leading-tight text-white/50 md:block">
                  {startsTier && info && <><b className="text-white/80">{tier}</b><br />{info.available ? formatINR(info.price) : "Sold out"}</>}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {fit.scale < 0.85 && <p className="mt-4 text-center text-[11px] text-white/40">Pinch to zoom for precise tapping</p>}
      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/60">
        <li className="flex items-center gap-2"><i className="h-3.5 w-3.5 rounded bg-white/30" />Available</li>
        <li className="flex items-center gap-2"><i className="h-3.5 w-3.5 rounded bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />Selected</li>
        <li className="flex items-center gap-2"><i className="h-3.5 w-3.5 rounded bg-white/[.07]" />Taken</li>
        <li className="flex items-center gap-2"><i className="h-3.5 w-3.5 rounded bg-white/30 ring-1 ring-gold/70" />Premium</li>
      </ul>
    </div>
  )
}
export const SeatMap = memo(SeatMapBase)
export { seatTier }
