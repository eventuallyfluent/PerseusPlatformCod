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
    <section className="grid gap-5 rounded-[30px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 text-[var(--portal-text)] shadow-[0_18px_40px_rgba(10,11,24,0.26)] lg:grid-cols-[1fr_auto] lg:items-end">
      <div className="space-y-3">
        <Badge variant="portal">{label}</Badge>
        <div className="space-y-2">
          <h1 className="text-4xl leading-none tracking-[-0.04em]">{title}</h1>
          <p className="max-w-2xl text-sm leading-7 text-[var(--portal-muted)]">{description}</p>
        </div>
      </div>
      <div className="space-y-3 lg:text-right">
        <div className="inline-flex rounded-full border border-[var(--portal-border)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[#d9d1f2]">{identity}</div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref}>
              <Button variant="ghost" className="border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[#d9d1f2] hover:bg-[rgba(255,255,255,0.08)] hover:text-white">
                {secondaryLabel}
              </Button>
            </Link>
          ) : null}
          {auxiliaryHref && auxiliaryLabel ? (
            <Link href={auxiliaryHref}>
              <Button variant="ghost" className="border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[#d9d1f2] hover:bg-[rgba(255,255,255,0.08)] hover:text-white">
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
