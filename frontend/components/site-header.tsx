"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LogOut, Menu, Search, Ticket, User as UserIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DarkModeToggle } from "@/components/dark-mode-toggle"
import { openSearch } from "@/components/command-menu"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/events", label: "Events" },
  { href: "/categories", label: "Categories" },
  { href: "/my-bookings", label: "My bookings" },
  { href: "/about", label: "About" },
]

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5", className)} aria-label="Vyaaspeeth home">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary via-fuchsia-500 to-violet text-white shadow-lg shadow-primary/30 transition-transform group-hover:-rotate-6 group-hover:scale-110">
        <Ticket className="h-5 w-5 -rotate-12" />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">Vyaas<span className="text-gradient">peeth</span></span>
    </Link>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, ready, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12)
    on(); window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])
  const signOut = async () => { await logout(); toast.success("Signed out. See you soon!"); router.push("/") }

  return (
    <header className={cn("sticky top-0 z-50 transition-all duration-300", scrolled ? "glass shadow-lg shadow-black/5" : "border-b border-transparent")}>
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/")
            return (
              <Link key={l.href} href={l.href} className={cn("relative rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground", active && "text-foreground")}>
                {l.label}
                <span className={cn("absolute inset-x-4 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-primary transition-transform duration-300", active && "scale-x-100")} />
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-1.5">
          <button onClick={openSearch} className="glass hidden items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground sm:flex" aria-label="Search events">
            <Search className="h-4 w-4" />Search
            <kbd className="rounded border bg-background/60 px-1.5 text-[10px] font-semibold">⌘K</kbd>
          </button>
          <Button variant="ghost" size="icon" className="rounded-full sm:hidden" onClick={openSearch} aria-label="Search"><Search className="h-5 w-5" /></Button>
          <DarkModeToggle />
          {!ready ? <span className="h-9 w-20" /> : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-violet font-display text-sm font-bold text-white ring-offset-background transition hover:scale-105" aria-label="Account menu">
                  {user.name.trim()[0]?.toUpperCase() ?? <UserIcon className="h-4 w-4" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel><div className="truncate font-semibold">{user.name}</div><div className="truncate text-xs font-normal text-muted-foreground">{user.email}</div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/my-bookings")}><Ticket className="mr-2 h-4 w-4" />My bookings</DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" className="rounded-full" asChild><Link href="/login">Sign in</Link></Button>
              <Button className="btn-glow rounded-full" asChild><Link href="/signup">Get started</Link></Button>
            </div>
          )}
          <Sheet open={menu} onOpenChange={setMenu}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="rounded-full md:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="mt-8 flex flex-col gap-1">
                {LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setMenu(false)} className="rounded-xl px-4 py-3 font-display text-lg font-semibold hover:bg-accent">{l.label}</Link>)}
                <div className="my-3 h-px bg-border" />
                {user ? <Button variant="outline" className="rounded-xl" onClick={() => { setMenu(false); signOut() }}>Sign out</Button> : (
                  <>
                    <Button variant="outline" className="rounded-xl" asChild><Link href="/login" onClick={() => setMenu(false)}>Sign in</Link></Button>
                    <Button className="btn-glow mt-2 rounded-xl" asChild><Link href="/signup" onClick={() => setMenu(false)}>Get started</Link></Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
