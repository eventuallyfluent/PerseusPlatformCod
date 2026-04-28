"use client";

import type { ReactNode } from "react";
import { buttonClassName, type ButtonVariant } from "@/components/ui/button";
import { HardLink } from "@/components/ui/hard-link";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

export function ButtonLink({ href, children, variant = "primary", className }: ButtonLinkProps) {
  return (
    <HardLink href={href} className={buttonClassName(variant, className)}>
      {children}
    </HardLink>
  );
}
