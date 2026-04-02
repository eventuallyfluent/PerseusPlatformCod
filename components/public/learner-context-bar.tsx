import Link from "next/link";

type LearnerContextBarProps = {
  label?: string;
  title: string;
  description: string;
  identity: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function LearnerContextBar({
  label = "Learner space",
  title,
  description,
  identity,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: LearnerContextBarProps) {
  return (
    <section className="grid gap-5 rounded-[34px] border border-[var(--border)] bg-[rgba(255,252,247,0.8)] p-6 shadow-[var(--shadow-soft)] lg:grid-cols-[1fr_auto] lg:items-end">
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">{label}</p>
        <div className="space-y-2">
          <h1 className="text-4xl leading-none tracking-[-0.04em] text-stone-950">{title}</h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600">{description}</p>
        </div>
      </div>
      <div className="space-y-3 lg:text-right">
        <div className="inline-flex rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-sm text-stone-700">{identity}</div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref} className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-white/70">
              {secondaryLabel}
            </Link>
          ) : null}
          {primaryHref && primaryLabel ? (
            <Link href={primaryHref} className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-800">
              {primaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
