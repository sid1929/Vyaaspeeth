import type { Booking } from "@/lib/api"
import { getEvent } from "@/lib/events"

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")

/** Downloads a calendar (.ics) file for a booking: generated locally, nothing is sent anywhere. */
export function downloadCalendar(b: Booking) {
  const ev = getEvent(b.eventId)
  const start = new Date(b.eventStartsAt)
  const end = new Date(start.getTime() + 2 * 3600_000)
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Vyaaspeeth//Booking//EN", "BEGIN:VEVENT",
    `UID:${b.bookingReference}@vyaaspeeth`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(b.eventTitle)}`, `DESCRIPTION:${esc(`Seats ${b.seats.map((x) => x.seat).join(", ")}. Booking ref ${b.bookingReference}`)}`,
    ...(ev ? [`LOCATION:${esc(`${ev.venue}, ${ev.city}`)}`] : []), "END:VEVENT", "END:VCALENDAR",
  ]
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }))
  const a = document.createElement("a")
  a.href = url; a.download = `${b.bookingReference}.ics`; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
