import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="container grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <div className="text-gradient font-display text-8xl font-extrabold">404</div>
        <h1 className="mt-4 font-display text-3xl font-bold">This show isn&apos;t on the programme</h1>
        <p className="mt-2 text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Button asChild className="btn-glow mt-8 rounded-full px-8"><Link href="/events">Browse events</Link></Button>
      </div>
    </div>
  )
}
