"use client"
import { useEffect, useRef } from "react"

const COLORS = ["#ff3d81", "#ffb547", "#7c5cff", "#22d3ee", "#34d399", "#ffffff"]

/** Lightweight canvas confetti burst (no dependency). Skipped for reduced-motion users. */
export function Confetti({ run }: { run: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!run || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const canvas = ref.current!
    const ctx = canvas.getContext("2d")!
    const dpr = window.devicePixelRatio || 1
    const resize = () => { canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    resize()
    const pieces = Array.from({ length: 160 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 220, y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 15 - 4,
      s: Math.random() * 8 + 4, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
      c: COLORS[(Math.random() * COLORS.length) | 0], round: Math.random() > 0.6,
    }))
    let raf = 0, t0 = performance.now()
    const frame = (t: number) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      for (const p of pieces) {
        p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c
        ctx.globalAlpha = Math.max(0, 1 - (t - t0) / 3200)
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill() } else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2)
        ctx.restore()
      }
      if (t - t0 < 3200) raf = requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [run])
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] h-full w-full" />
}
