"use client";

import type { PropsWithChildren, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AuthEntryShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  successMessage?: string | null;
  aside?: ReactNode;
}>;

export function AuthEntryShell({ eyebrow, title, description, successMessage, aside, children }: AuthEntryShellProps) {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
      <div className="space-y-8">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <Badge variant="accent">{eyebrow}</Badge>
          </div>
          <h1 className="max-w-3xl font-serif text-[clamp(2.65rem,6vw,4.85rem)] leading-[0.98] text-[var(--foreground)]">
            {title}
          </h1>
          <p className="max-w-2xl text-lg leading-9 text-[var(--foreground-soft)]">{description}</p>
        </div>
        {aside ? <div className="grid gap-4 sm:grid-cols-2">{aside}</div> : null}
      </div>

      <Card className="space-y-6 rounded-[22px] bg-[var(--surface-panel)] p-7 sm:p-8">
        {successMessage ? (
          <p className="rounded-[20px] bg-[var(--success-soft)] px-4 py-3 text-sm font-medium text-[var(--success)]">{successMessage}</p>
        ) : null}
        {children}
      </Card>
    </div>
  );
}
