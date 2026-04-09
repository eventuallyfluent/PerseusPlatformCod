"use client";

import { useEffect } from "react";
import { HardLink } from "@/components/ui/hard-link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="admin-theme min-h-screen bg-stone-100 px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-stone-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Admin error</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">This admin page hit a server problem.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-700">
          The editor should stay stable and return a clear result. Retry this screen once. If it happens again, go back to the admin overview and reopen the editor.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white"
          >
            Try again
          </button>
          <HardLink
            href="/admin"
            className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-800"
          >
            Back to admin
          </HardLink>
        </div>
      </div>
    </div>
  );
}
