"use client"
import { Suspense } from "react"
import { RequireAuth } from "@/lib/auth"
import { BookingFlow } from "@/components/booking-flow"

export default function BookingPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="container py-16"><div className="skeleton h-96" /></div>}>
        <BookingFlow />
      </Suspense>
    </RequireAuth>
  )
}
