import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { HardLink } from "@/components/ui/hard-link";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-[var(--text-primary)] sm:text-[1.7rem]">{title}</h1>
        {description ? <p className="max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

type AdminStatProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  href?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
};

const statToneClass = {
  neutral: "border-[var(--border)]",
  success: "border-emerald-200/70",
  warning: "border-amber-200/70",
  danger: "border-rose-200/70",
  accent: "border-[var(--accent)]/30",
};

export function AdminStat({ label, value, detail, href, tone = "neutral" }: AdminStatProps) {
  const content = (
    <div className={cn("rounded-lg border bg-[var(--surface-panel)] p-4 shadow-sm", statToneClass[tone])}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-none text-[var(--text-primary)]">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-5 text-[var(--text-secondary)]">{detail}</p> : null}
    </div>
  );

  return href ? (
    <HardLink href={href} className="block transition hover:-translate-y-0.5">
      {content}
    </HardLink>
  ) : content;
}

type StatusTone = "neutral" | "success" | "warning" | "danger" | "accent";

const statusToneClass: Record<StatusTone, string> = {
  neutral: "border-[var(--border)] bg-[var(--surface-panel-strong)] text-[var(--text-secondary)]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  accent: "border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]",
};

export function AdminStatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: StatusTone }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]", statusToneClass[tone])}>
      {children}
    </span>
  );
}

type AdminDataTableColumn = {
  header: ReactNode;
  className?: string;
  mobileLabel?: ReactNode;
};

type AdminDataTableRow = {
  key: string;
  cells: ReactNode[];
};

type AdminDataTableProps = {
  columns: AdminDataTableColumn[];
  rows: AdminDataTableRow[];
  empty?: ReactNode;
};

export function AdminDataTable({ columns, rows, empty }: AdminDataTableProps) {
  if (rows.length === 0) {
    return (
      <Card className="rounded-lg p-6 text-sm text-[var(--text-secondary)]">
        {empty ?? "No records yet."}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-lg p-0">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full">
          <thead className="bg-[var(--surface-panel-strong)] text-[var(--text-muted)]">
            <tr>
              {columns.map((column, index) => (
                <th key={index} className={column.className}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="align-top transition hover:bg-[var(--surface-panel-strong)]/70">
                {row.cells.map((cell, index) => (
                  <td key={index} className={columns[index]?.className}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {rows.map((row) => (
          <div key={row.key} className="rounded-lg border border-[var(--border)] bg-[var(--surface-panel-strong)] p-4">
            <div className="grid gap-3">
              {row.cells.map((cell, index) => (
                <div key={index} className="grid gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {columns[index]?.mobileLabel ?? columns[index]?.header}
                  </span>
                  <div className="min-w-0 text-sm text-[var(--text-primary)]">{cell}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AdminActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

export const adminButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-stone-950 px-4 py-2.5 text-sm font-semibold text-stone-50 transition hover:bg-stone-800";

export const adminSecondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-panel-strong)]";
