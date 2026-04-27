import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: "primary" | "secondary" | "ghost" | "premium" | "portal";
};

export function Button({ children, className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold tracking-[0.01em] transition duration-200 will-change-transform",
        "focus-visible:outline-none focus-visible:ring-4",
        variant === "primary" &&
          "bg-[var(--button-primary-background)] text-white shadow-[var(--button-primary-shadow)] hover:-translate-y-px hover:bg-[var(--button-primary-hover)] focus-visible:ring-[rgba(143,44,255,0.22)]",
        variant === "secondary" &&
          "border border-[var(--button-secondary-border)] bg-[var(--button-secondary-background)] text-[var(--button-secondary-text)] hover:-translate-y-px hover:bg-[var(--button-secondary-hover)] focus-visible:ring-[rgba(143,44,255,0.16)]",
        variant === "ghost" &&
          "border border-[var(--border)] bg-[var(--button-ghost-background)] text-[var(--button-ghost-text)] hover:border-[var(--border-strong)] hover:bg-[var(--button-ghost-hover-background)] hover:text-[var(--text-primary)] focus-visible:ring-[rgba(88,97,130,0.16)]",
        variant === "premium" &&
          "bg-[var(--premium)] text-[#211607] shadow-[0_16px_36px_rgba(212,168,70,0.2)] hover:-translate-y-px hover:brightness-105 focus-visible:ring-[rgba(212,168,70,0.18)]",
        variant === "portal" &&
          "bg-[var(--accent)] text-white shadow-[0_18px_34px_rgba(143,44,255,0.18)] hover:-translate-y-px hover:bg-[var(--accent-strong)] focus-visible:ring-[rgba(143,44,255,0.24)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
