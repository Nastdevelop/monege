export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-surface" />
      <div className="mt-4 h-4 w-64 animate-pulse rounded bg-surface" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-72 animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
