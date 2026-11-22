"use client"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DarkModeToggle() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  useEffect(() => setMounted(true), [])
  const dark = mounted && resolvedTheme === "dark"
  return (
    <Button variant="ghost" size="icon" className="rounded-full" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setTheme(dark ? "light" : "dark")}>
      {mounted ? (dark ? <Sun className="h-5 w-5 transition-transform hover:rotate-45" /> : <Moon className="h-5 w-5 transition-transform hover:-rotate-12" />) : <span className="h-5 w-5" />}
    </Button>
  )
}
