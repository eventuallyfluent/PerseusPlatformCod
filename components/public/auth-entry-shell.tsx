"use client";

import type { PropsWithChildren, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AuthEntryShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  successMessage?: string | null;
  aside: ReactNode;
}>;

export function AuthEntryShell({ eyebrow, title, description, successMessage, aside, children }: AuthEntryShellProps) {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
      <div className="space-y-8">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <Badge variant="accent">{eyebrow}</Badge>
            <Badge variant="premium">Magic link access</Badge>
          </div>
          <h1 className="max-w-3xl text-6xl leading-[0.92] tracking-[-0.06em] text-[var(--foreground)] sm:text-7xl lg:text-[5.5rem]">
            {title}
          </h1>
          <p className="max-w-2xl text-lg leading-9 text-[var(--foreground-soft)]">{description}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">{aside}</div>
      </div>

      <Card className="space-y-6 rounded-[34px] bg-[rgba(255,255,255,0.86)] p-8">
        {successMessage ? (
          <p className="rounded-[20px] bg-[var(--success-soft)] px-4 py-3 text-sm font-medium text-[var(--success)]">{successMessage}</p>
        ) : null}
        {children}
      </Card>
    </div>
  );
}
