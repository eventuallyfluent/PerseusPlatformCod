import type { PropsWithChildren, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { adminButtonClass } from "@/components/admin/admin-ui";

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
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_300px]">
      <Card className="space-y-6 rounded-lg p-5 sm:p-6">
        <div className="space-y-3 border-b border-[var(--border)] pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-700">{eyebrow}</p>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold leading-tight text-stone-950">{title}</h2>
            <p className="max-w-3xl text-sm leading-6 text-stone-700">{description}</p>
          </div>
        </div>

        <form action={action} className="space-y-6">
          {children}
          <div className="sticky bottom-0 -mx-5 border-t border-[var(--border)] bg-[var(--surface-panel)] px-5 py-4 sm:-mx-6 sm:px-6">
            <button className={adminButtonClass} type="submit">
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
  id,
  title,
  description,
  collapsible,
  defaultOpen,
  children,
}: PropsWithChildren<{ id?: string; title: string; description: string; collapsible?: boolean; defaultOpen?: boolean }>) {
  if (collapsible) {
    return (
      <section id={id} className="scroll-mt-24 border-b border-[var(--border)] pb-8 last:border-b-0 last:pb-0">
        <details className="group rounded-lg border border-stone-200 bg-stone-50 px-4 py-4" open={defaultOpen}>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-stone-950">{title}</h3>
              <p className="text-sm leading-6 text-stone-700">{description}</p>
            </div>
            <span className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 transition group-open:border-stone-400 group-open:text-stone-800">
              Toggle
            </span>
          </summary>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">{children}</div>
        </details>
      </section>
    );
  }

  return (
    <section id={id} className="scroll-mt-24 space-y-5 border-b border-[var(--border)] pb-8 last:border-b-0 last:pb-0">
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-stone-950">{title}</h3>
        <p className="text-sm leading-6 text-stone-700">{description}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </section>
  );
}
