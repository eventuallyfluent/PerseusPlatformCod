export default function AdminLoading() {
  return (
    <div className="admin-theme min-h-screen bg-stone-100 px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-stone-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Loading admin</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">Opening the operator workspace.</h1>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-stone-900" />
        </div>
      </div>
    </div>
  );
}
