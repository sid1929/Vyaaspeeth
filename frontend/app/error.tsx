"use client"
import { Button } from "@/components/ui/button"

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <div className="text-6xl">🎭</div>
        <h1 className="mt-4 font-display text-3xl font-bold">Something went off-script</h1>
        <p className="mt-2 text-muted-foreground">An unexpected error occurred. Please try again.</p>
        <Button onClick={reset} className="btn-glow mt-8 rounded-full px-8">Try again</Button>
      </div>
    </div>
  )
}
