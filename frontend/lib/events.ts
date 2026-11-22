import catalog from "./catalog.json"

export type Tier = { name: "Premium" | "Standard" | "Economy"; price: number; available: boolean }
export type Hall = { rows: number; cols: number; aisleAfter: number; tiers: Record<Tier["name"], string[]> }
export type EventItem = {
  id: string; title: string; description: string; longDescription: string; category: string
  startsAt: string; time: string; venue: string; city: string; duration: string
  rating: number; reviewCount: number; tiers: Tier[]; cast: string[]; features: string[]; trending: boolean; hall: Hall
}

// Display copy of backend/data/events.json. The server is the source of truth for prices:
// the API recomputes every total, so editing numbers here can never change what a customer pays.
export const EVENTS = catalog as EventItem[]
export const SERVICE_FEE = 50
export const MAX_QTY = 10

export const getEvent = (id: string) => EVENTS.find((e) => e.id === id)
export const minPrice = (e: EventItem) => Math.min(...e.tiers.filter((t) => t.available).map((t) => t.price))
export const isSoldOut = (e: EventItem) => e.tiers.every((t) => !t.available)

export const CATEGORIES = [
  { name: "Theater", emoji: "🎭", blurb: "Stage dramas & musicals", from: "#f59e0b", to: "#be123c" },
  { name: "Comedy", emoji: "🎤", blurb: "Stand-up that hurts (in a good way)", from: "#fb923c", to: "#db2777" },
  { name: "Classical Music", emoji: "🎻", blurb: "Ragas, gharanas & legends", from: "#6366f1", to: "#0d9488" },
  { name: "Modern Music", emoji: "🎸", blurb: "Live bands & big nights", from: "#ef4444", to: "#7c3aed" },
  { name: "Dance", emoji: "💃", blurb: "Classical to contemporary", from: "#10b981", to: "#f59e0b" },
  { name: "Art & Culture", emoji: "🎨", blurb: "Galleries & exhibitions", from: "#06b6d4", to: "#8b5cf6" },
] as const

export const categoryMeta = (name: string) => CATEGORIES.find((c) => c.name === name) ?? CATEGORIES[0]

// Poster art is generated from gradients + emoji, so there are no image files to load or license.
export const POSTERS: Record<string, { emoji: string; from: string; to: string }> = {
  "1": { emoji: "🎭", from: "#f59e0b", to: "#9f1239" },
  "2": { emoji: "🎤", from: "#fb923c", to: "#be185d" },
  "3": { emoji: "🎻", from: "#6366f1", to: "#0f766e" },
  "4": { emoji: "🪩", from: "#d946ef", to: "#4c1d95" },
  "5": { emoji: "💃", from: "#10b981", to: "#d97706" },
  "6": { emoji: "🎨", from: "#06b6d4", to: "#7c3aed" },
  "7": { emoji: "🎸", from: "#ef4444", to: "#1e1b4b" },
  "8": { emoji: "🪶", from: "#64748b", to: "#6d28d9" },
}
export const poster = (id: string) => POSTERS[id] ?? POSTERS["1"]

const IST = "Asia/Kolkata"
export const formatINR = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: IST, ...opts }).format(new Date(iso))
export const dayParts = (iso: string) => ({
  day: new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "2-digit" }).format(new Date(iso)),
  month: new Intl.DateTimeFormat("en-IN", { timeZone: IST, month: "short" }).format(new Date(iso)).toUpperCase(),
  weekday: new Intl.DateTimeFormat("en-IN", { timeZone: IST, weekday: "short" }).format(new Date(iso)),
})

// ---- seats -------------------------------------------------------------------------------------------
export const seatId = (row: string, col: number) => `${row}${col}`
export const parseSeat = (id: string) => ({ row: id[0], col: Number(id.slice(1)) })
export const seatTier = (e: EventItem, id: string): Tier["name"] | null => {
  const { row } = parseSeat(id)
  return (Object.entries(e.hall.tiers).find(([, rows]) => rows.includes(row))?.[0] as Tier["name"]) ?? null
}
export const seatPrice = (e: EventItem, id: string) => e.tiers.find((t) => t.name === seatTier(e, id))?.price ?? 0
export const tierSeatCount = (e: EventItem, tier: Tier["name"]) => e.hall.tiers[tier].length * e.hall.cols
export const totalSeats = (e: EventItem) => e.hall.cols * Object.values(e.hall.tiers).reduce((n, r) => n + r.length, 0)
export const ordinal = (n: number) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0] }

const FORMATS: Record<string, string> = {
  Theater: "Live Theatre", Comedy: "Stand-up Live", "Classical Music": "Concert Hall",
  "Modern Music": "Live Concert", Dance: "Dance Recital", "Art & Culture": "Exhibition Hall",
}
export const formatOf = (e: EventItem) => FORMATS[e.category] ?? "Live Event"
export const dateKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(iso))
