import type { PropsWithChildren, ReactNode } from "react";
import { Card } from "@/components/ui/card";

type ProductFormShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  aside: ReactNode;
}>;

export function ProductFormShell({
  eyebrow,
  title,
  description,
  submitLabel,
  action,
  aside,
  children,
}: ProductFormShellProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_320px]">
      <Card className="space-y-8 p-8">
        <div className="space-y-4 border-b border-[var(--border)] pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">{eyebrow}</p>
          <div className="space-y-3">
            <h2 className="text-4xl leading-none tracking-[-0.04em] text-stone-950">{title}</h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">{description}</p>
          </div>
        </div>

        <form action={action} className="space-y-8">
          {children}
          <div className="border-t border-[var(--border)] pt-6">
            <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" type="submit">
              {submitLabel}
            </button>
          </div>
        </form>
      </Card>

      <div className="space-y-4">{aside}</div>
    </div>
  );
}

export function ProductFormSection({
  title,
  description,
  children,
}: PropsWithChildren<{ title: string; description: string }>) {
  return (
    <section className="grid gap-5 border-b border-[var(--border)] pb-8 last:border-b-0 last:pb-0 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-950">{title}</h3>
        <p className="text-sm leading-7 text-stone-700">{description}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </section>
  );
}
