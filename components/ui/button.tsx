import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ children, className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold tracking-[0.02em] transition duration-200",
        variant === "primary" && "bg-[var(--accent)] text-stone-950 hover:brightness-105",
        variant === "secondary" && "bg-stone-950 text-stone-50 hover:bg-stone-800",
        variant === "ghost" && "bg-transparent text-stone-700 hover:bg-white/60",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
