import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = PropsWithChildren<{
  variant?: "default" | "accent" | "premium" | "success" | "warning" | "danger" | "muted" | "portal";
  className?: string;
}>;

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]",
        variant === "default" && "border border-[var(--border)] bg-[var(--surface-panel-strong)] text-[var(--text-secondary)]",
        variant === "accent" && "bg-[var(--accent-soft)] text-[var(--accent)]",
        variant === "premium" && "bg-[var(--premium-soft)] text-[var(--premium)]",
        variant === "success" && "bg-[var(--success-soft)] text-[var(--success)]",
        variant === "warning" && "bg-[var(--warning-soft)] text-[var(--warning)]",
        variant === "danger" && "bg-[var(--danger-soft)] text-[var(--danger)]",
        variant === "muted" && "bg-[var(--surface-panel-strong)] text-[var(--text-muted)]",
        variant === "portal" && "border border-[var(--portal-border)] bg-[var(--surface-panel-strong)] text-[var(--text-secondary)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
