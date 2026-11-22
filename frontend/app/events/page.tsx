import { Suspense } from "react"
import type { Metadata } from "next"
import { EventsBrowser } from "@/components/events-browser"

export const metadata: Metadata = { title: "Events", description: "Browse theatre, comedy, concerts, dance and cultural events across India." }

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="container py-16"><div className="skeleton h-72" /></div>}>
      <EventsBrowser />
    </Suspense>
  )
}
