"use client"
import { useCallback, useEffect, useState } from "react"

const KEY = "vy_wishlist"
const read = (): string[] => {
  try { return JSON.parse(window.localStorage.getItem(KEY) || "[]") } catch { return [] }
}

/** Saved events live only in this browser (no account data involved). */
export function useWishlist() {
  const [ids, setIds] = useState<string[]>([])
  useEffect(() => {
    setIds(read())
    const sync = () => setIds(read())
    window.addEventListener("storage", sync); window.addEventListener("vy:wishlist", sync)
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("vy:wishlist", sync) }
  }, [])
  const toggle = useCallback((id: string) => {
    const next = read().includes(id) ? read().filter((x) => x !== id) : [...read(), id]
    try { window.localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private mode */ }
    window.dispatchEvent(new Event("vy:wishlist"))
  }, [])
  return { ids, has: (id: string) => ids.includes(id), toggle }
}
