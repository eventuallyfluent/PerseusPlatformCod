export default function AdminLoading() {
  return (
    <div className="min-w-0 space-y-5" aria-busy="true" aria-label="Loading admin page">
      <div className="flex min-h-20 items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div className="space-y-3">
          <div className="h-7 w-48 animate-pulse rounded-md bg-[var(--surface-panel-strong)]" />
          <div className="h-4 w-72 max-w-[70vw] animate-pulse rounded-md bg-[var(--surface-panel-strong)]" />
        </div>
        <div className="hidden h-9 w-36 animate-pulse rounded-lg bg-[var(--surface-panel-strong)] sm:block" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[10px] border border-[var(--border)] bg-[var(--surface-panel)]" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-[10px] border border-[var(--border)] bg-[var(--surface-panel)]" />
      <p className="sr-only">Loading the requested admin page.</p>
    </div>
  );
}
