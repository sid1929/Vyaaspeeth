"use client"
import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Fades/slides children in when they scroll into view. Falls back to visible without IntersectionObserver. */
export function Reveal({ children, className, delay = 0, as: Tag = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "section" | "li" }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!("IntersectionObserver" in window)) { el.classList.add("in"); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect() } }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const Comp = Tag as "div"
  return <Comp ref={ref} className={cn("reveal", className)} style={{ ["--d" as string]: `${delay}ms` }}>{children}</Comp>
}
