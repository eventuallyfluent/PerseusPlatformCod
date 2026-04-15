import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type LearnerContextBarProps = {
  label?: string;
  title: string;
  description: string;
  identity: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  auxiliaryHref?: string;
  auxiliaryLabel?: string;
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
  auxiliaryHref,
  auxiliaryLabel,
}: LearnerContextBarProps) {
  return (
    <section className="grid gap-5 rounded-[30px] border border-[var(--border)] bg-[var(--surface-panel)] p-6 text-[var(--text-primary)] shadow-[var(--shadow-panel)] lg:grid-cols-[1fr_auto] lg:items-end">
      <div className="space-y-3">
        <Badge variant="portal">{label}</Badge>
        <div className="space-y-2">
          <h1 className="text-4xl leading-none tracking-[-0.04em]">{title}</h1>
          <p className="max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
      <div className="space-y-3 lg:text-right">
        <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-panel-strong)] px-4 py-2 text-sm text-[var(--text-secondary)]">{identity}</div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref}>
              <Button variant="ghost" className="px-4 py-2">
                {secondaryLabel}
              </Button>
            </Link>
          ) : null}
          {auxiliaryHref && auxiliaryLabel ? (
            <Link href={auxiliaryHref}>
              <Button variant="ghost" className="px-4 py-2">
                {auxiliaryLabel}
              </Button>
            </Link>
          ) : null}
          {primaryHref && primaryLabel ? (
            <Link href={primaryHref}>
              <Button variant="portal" className="px-4 py-2">
                {primaryLabel}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
