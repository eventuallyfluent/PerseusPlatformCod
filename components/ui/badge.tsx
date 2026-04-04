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
        variant === "default" && "bg-[rgba(143,44,255,0.1)] text-[var(--accent)]",
        variant === "accent" && "bg-[rgba(143,44,255,0.14)] text-[var(--accent)]",
        variant === "premium" && "bg-[var(--premium-soft)] text-[var(--premium)]",
        variant === "success" && "bg-[var(--success-soft)] text-[var(--success)]",
        variant === "warning" && "bg-[var(--warning-soft)] text-[var(--warning)]",
        variant === "danger" && "bg-[var(--danger-soft)] text-[var(--danger)]",
        variant === "muted" && "bg-[rgba(88,97,130,0.1)] text-[var(--muted)]",
        variant === "portal" && "bg-[rgba(143,44,255,0.16)] text-[#d8b8ff]",
        className,
      )}
    >
      {children}
    </span>
  );
}
