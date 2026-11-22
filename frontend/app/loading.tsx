export default function Loading() {
  return (
    <div className="container py-16">
      <div className="skeleton mb-8 h-14 w-2/3" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton aspect-[4/5]" />)}
      </div>
    </div>
  )
}
