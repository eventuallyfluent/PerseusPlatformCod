"use client";

import type { PropsWithChildren, ReactNode } from "react";
import { Card } from "@/components/ui/card";

type AuthEntryShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  successMessage?: string | null;
  aside: ReactNode;
}>;

export function AuthEntryShell({ eyebrow, title, description, successMessage, aside, children }: AuthEntryShellProps) {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div className="space-y-6">
        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-stone-500">{eyebrow}</p>
          <h1 className="max-w-xl text-6xl leading-[0.95] tracking-[-0.05em] text-stone-950 sm:text-7xl">{title}</h1>
          <p className="max-w-xl text-base leading-8 text-stone-600">{description}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">{aside}</div>
      </div>

      <Card className="space-y-5 p-8">
        {successMessage ? <p className="rounded-[22px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p> : null}
        {children}
      </Card>
    </div>
  );
}
