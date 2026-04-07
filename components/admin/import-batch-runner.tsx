"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ImportBatchRunnerProps = {
  batchId: string;
  isProcessing: boolean;
};

export function ImportBatchRunner({ batchId, isProcessing }: ImportBatchRunnerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isProcessing) {
      return;
    }

    let cancelled = false;

    async function run() {
      setMessage("Processing next import chunk...");

      const response = await fetch(`/api/imports/batches/${batchId}/process`, {
        method: "POST",
      });

      if (!response.ok) {
        setMessage("Processing stopped. Refresh to inspect the batch report.");
        router.refresh();
        return;
      }

      const data = (await response.json()) as {
        status: string;
        hasMore: boolean;
        executionSummary?: {
          processedCount?: number;
          totalCount?: number;
        };
      };

      const processed = Number(data.executionSummary?.processedCount ?? 0);
      const total = Number(data.executionSummary?.totalCount ?? 0);

      if (!cancelled) {
        setMessage(total > 0 ? `Processed ${processed} of ${total} rows...` : "Processing import...");
      }

      router.refresh();
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [batchId, isProcessing, router]);

  if (!isProcessing || !message) {
    return null;
  }

  return <p className="rounded-[20px] bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</p>;
}
