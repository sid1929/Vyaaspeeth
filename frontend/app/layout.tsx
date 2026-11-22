import type React from "react"
import type { Metadata, Viewport } from "next"
import "@fontsource-variable/inter"
import "@fontsource-variable/bricolage-grotesque"
import "@fontsource/bebas-neue"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/auth"
import { AuroraBg } from "@/components/aurora-bg"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CommandMenu } from "@/components/command-menu"
import { ApiStatus } from "@/components/api-status"

export const metadata: Metadata = {
  title: { default: "Vyaaspeeth · Live events, booked in seconds", template: "%s · Vyaaspeeth" },
  description: "Discover and book theatre, comedy, concerts, dance and cultural events across India. Secure checkout with server-verified pricing.",
  keywords: ["events", "theatre", "concerts", "comedy", "tickets", "booking", "India"],
}
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0b0714" }, { media: "(prefers-color-scheme: light)", color: "#fbf7f0" }] }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="grain min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Skip to content</a>
            <AuroraBg />
            <SiteHeader />
            <ApiStatus />
            <main id="main">{children}</main>
            <SiteFooter />
            <CommandMenu />
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
