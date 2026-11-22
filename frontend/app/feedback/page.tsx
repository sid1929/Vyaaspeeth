import type { Metadata } from "next"
import { MessageForm } from "@/components/message-form"
import { Reveal } from "@/components/reveal"

export const metadata: Metadata = { title: "Feedback" }

export default function FeedbackPage() {
  return (
    <div className="container max-w-2xl py-12">
      <Reveal className="mb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Feedback</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">Help us improve</h1>
        <p className="mt-3 text-muted-foreground">Your thoughts shape what we build next.</p>
      </Reveal>
      <Reveal><MessageForm kind="feedback" /></Reveal>
    </div>
  )
}
