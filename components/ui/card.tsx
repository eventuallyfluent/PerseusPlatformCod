import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "perseus-card rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
