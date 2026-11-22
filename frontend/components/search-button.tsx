"use client"
import type { ReactNode } from "react"
import { openSearch } from "@/components/command-menu"

export function SearchButton({ children, className }: { children: ReactNode; className?: string }) {
  return <button type="button" onClick={openSearch} className={className}>{children}</button>
}
