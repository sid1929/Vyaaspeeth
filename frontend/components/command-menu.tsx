"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, Compass, Home, Info, Mail, MessageSquare, Ticket } from "lucide-react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { EVENTS, CATEGORIES, formatDate } from "@/lib/events"

export const openSearch = () => window.dispatchEvent(new Event("vy:open-search"))

/** Global ⌘K / Ctrl+K palette: jump to any event, category or page. */
export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o) } }
    const custom = () => setOpen(true)
    window.addEventListener("keydown", key); window.addEventListener("vy:open-search", custom)
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("vy:open-search", custom) }
  }, [])
  const go = (href: string) => { setOpen(false); router.push(href) }
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search events, categories, pages…" />
      <CommandList>
        <CommandEmpty>No results. Try “comedy” or “Mumbai”.</CommandEmpty>
        <CommandGroup heading="Events">
          {EVENTS.map((e) => (
            <CommandItem key={e.id} value={`${e.title} ${e.category} ${e.city} ${e.venue}`} onSelect={() => go(`/events/${e.id}`)}>
              <CalendarDays className="mr-2 h-4 w-4 text-primary" />
              <span className="flex-1 truncate">{e.title}</span>
              <span className="ml-2 text-xs text-muted-foreground">{e.city} · {formatDate(e.startsAt, { day: "numeric", month: "short" })}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Categories">
          {CATEGORIES.map((c) => (
            <CommandItem key={c.name} value={`category ${c.name}`} onSelect={() => go(`/events?cat=${encodeURIComponent(c.name)}`)}>
              <span className="mr-2">{c.emoji}</span>{c.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => go("/")}><Home className="mr-2 h-4 w-4" />Home</CommandItem>
          <CommandItem onSelect={() => go("/events")}><Compass className="mr-2 h-4 w-4" />All events</CommandItem>
          <CommandItem onSelect={() => go("/my-bookings")}><Ticket className="mr-2 h-4 w-4" />My bookings</CommandItem>
          <CommandItem onSelect={() => go("/about")}><Info className="mr-2 h-4 w-4" />About & security</CommandItem>
          <CommandItem onSelect={() => go("/contact")}><Mail className="mr-2 h-4 w-4" />Contact</CommandItem>
          <CommandItem onSelect={() => go("/feedback")}><MessageSquare className="mr-2 h-4 w-4" />Feedback</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
