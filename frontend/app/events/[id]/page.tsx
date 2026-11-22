import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { EventDetail } from "@/components/event-detail"
import { EVENTS, getEvent } from "@/lib/events"

// Unknown ids return a real 404 instead of a soft-404 page.
export const dynamicParams = false

export function generateStaticParams() {
  return EVENTS.map((e) => ({ id: e.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const e = getEvent(id)
  return e ? { title: e.title, description: e.description } : { title: "Event not found" }
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = getEvent(id)
  if (!event) notFound()
  return <EventDetail event={event} />
}
