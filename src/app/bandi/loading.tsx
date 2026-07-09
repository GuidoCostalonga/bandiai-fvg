/** Skeleton shown while the bandi list streams in (Suspense fallback). */
export default function Loading() {
  return (
    <div className="container space-y-6 py-8">
      <div className="skeleton h-9 w-40" />
      <div className="skeleton h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-48 w-full" />
        ))}
      </div>
    </div>
  )
}
