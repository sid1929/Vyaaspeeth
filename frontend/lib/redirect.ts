/** Only allow same-site relative paths after login, so ?next=https://evil.example can't be used for open redirects. */
export function safeNext(next: string | null, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback
  return next
}
