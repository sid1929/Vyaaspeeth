"use client"
import { useEffect, useState } from "react"

export function RotatingWords({ words }: { words: string[] }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = setInterval(() => setI((x) => (x + 1) % words.length), 2600)
    return () => clearInterval(t)
  }, [words.length])
  return (
    <span className="word-swap relative inline-block [perspective:600px]" aria-live="polite">
      <span key={i} className="text-gradient">{words[i]}</span>
    </span>
  )
}
