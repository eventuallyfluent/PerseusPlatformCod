"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ImportBatchRunnerProps = {
  batchId: string;
  isProcessing: boolean;
  initialProcessedCount: number;
  initialTotalCount: number;
};

export function ImportBatchRunner({ batchId, isProcessing, initialProcessedCount, initialTotalCount }: ImportBatchRunnerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [processedCount, setProcessedCount] = useState(initialProcessedCount);
  const [totalCount, setTotalCount] = useState(initialTotalCount);

  useEffect(() => {
    if (!isProcessing) {
      return;
    }

    let cancelled = false;

    async function run() {
      let nextProcessed = initialProcessedCount;
      let nextTotal = initialTotalCount;

      try {
        while (!cancelled) {
          setMessage(nextTotal > 0 ? `Processed ${nextProcessed} of ${nextTotal} rows...` : "Processing import...");

          const response = await fetch(`/api/imports/batches/${batchId}/process`, {
            method: "POST",
            cache: "no-store",
          });

          if (!response.ok) {
            setMessage("Import stopped. Refreshing the batch report...");
            router.refresh();
            return;
          }

          const data = (await response.json()) as {
            status: string;
            hasMore: boolean;
            error?: string;
            executionSummary?: {
              processedCount?: number;
              totalCount?: number;
            };
          };

          nextProcessed = Number(data.executionSummary?.processedCount ?? nextProcessed);
          nextTotal = Number(data.executionSummary?.totalCount ?? nextTotal);
          setProcessedCount(nextProcessed);
          setTotalCount(nextTotal);

          if (!data.hasMore || data.status !== "PROCESSING") {
            setMessage(data.error ? `Import failed: ${data.error}` : null);
            router.refresh();
            return;
          }
        }
      } catch {
        if (!cancelled) {
          setMessage("Import stopped unexpectedly. Refreshing the batch report...");
          router.refresh();
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [batchId, initialProcessedCount, initialTotalCount, isProcessing, router]);

  if (!isProcessing) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-[20px] bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p>{message ?? "Processing import..."}</p>
      {totalCount > 0 ? <p className="text-xs font-medium uppercase tracking-[0.2em]">{processedCount} / {totalCount}</p> : null}
    </div>
  );
}
