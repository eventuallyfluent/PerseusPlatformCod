import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function ProductTypeCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: "course" | "bundle";
}) {
  return (
    <Link href={href}>
      <Card className="flex h-full min-h-[320px] flex-col items-center justify-center gap-5 border-stone-200 bg-white p-10 text-center transition hover:-translate-y-1 hover:border-stone-300 hover:shadow-[0_20px_40px_rgba(28,21,18,0.08)]">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[rgba(222,234,255,0.8)]">
          {icon === "course" ? (
            <svg viewBox="0 0 64 64" aria-hidden="true" className="h-16 w-16 text-[#4f60c8]">
              <path
                d="M18 16h20c5 0 9 4 9 9v23c0 2-2 3-4 2l-10-5-10 5c-2 1-4 0-4-2V16Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path d="M25 24h15M25 31h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 64 64" aria-hidden="true" className="h-16 w-16 text-[#4f60c8]">
              <path
                d="M14 22h36v25c0 3-2 5-5 5H19c-3 0-5-2-5-5V22Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path d="M23 22c0-5 4-9 9-9s9 4 9 9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M24 33h16M24 40h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold uppercase tracking-[0.18em] text-stone-800">{title}</h2>
          <p className="mx-auto max-w-[240px] text-base leading-7 text-stone-500">{description}</p>
        </div>
      </Card>
    </Link>
  );
}

export default function NewProductChooserPage() {
  return (
    <AdminShell title="Add product" description="Choose what you want to create.">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
          <ProductTypeCard href="/admin/courses/new/course" title="Course" description="Sell your course" icon="course" />
          <ProductTypeCard href="/admin/bundles/new" title="Bundle" description="Bundle multiple courses for sale" icon="bundle" />
        </div>

        <div className="rounded-[24px] border border-dashed border-stone-300 bg-stone-50/80 px-6 py-5 text-center text-sm text-stone-500">
          More product types can be added later. For now, Perseus supports courses and bundles only.
        </div>
      </div>
    </AdminShell>
  );
}
