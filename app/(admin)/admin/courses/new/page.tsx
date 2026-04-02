import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function NewProductChooserPage() {
  return (
    <AdminShell title="Add new product" description="Start with the sellable shape. Perseus keeps the creation flow explicit so product logic stays clean.">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card className="space-y-4 bg-[linear-gradient(135deg,rgba(255,252,247,0.88),rgba(245,239,229,0.92))] p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Creation flow</p>
            <h2 className="text-5xl leading-none tracking-[-0.05em] text-stone-950">Choose the product shape before you enter content.</h2>
            <p className="max-w-2xl text-sm leading-8 text-stone-600">
              Courses and bundles share the same platform underneath, but the sales page, checkout messaging, and fulfillment path
              differ. Pick the correct container first, then complete the structured fields.
            </p>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Link href="/admin/courses/new/course">
              <Card className="h-full space-y-5 border-stone-300 bg-[rgba(255,252,247,0.78)] p-7 transition hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(28,21,18,0.08)]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Available now</p>
                  <span className="rounded-full border border-stone-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">
                    Course
                  </span>
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl leading-none tracking-[-0.03em] text-stone-950">New Course</h2>
                  <p className="text-sm leading-7 text-stone-600">
                    A structured learning product with curriculum, lessons, generated sales sections, checkout, and learner delivery.
                  </p>
                </div>
                <ul className="space-y-2 text-sm leading-7 text-stone-600">
                  <li>Modules and lessons</li>
                  <li>Generated sales page</li>
                  <li>Single-course enrollment after purchase</li>
                </ul>
              </Card>
            </Link>

            <Link href="/admin/bundles/new">
              <Card className="h-full space-y-5 border-stone-300 bg-[rgba(255,252,247,0.78)] p-7 transition hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(28,21,18,0.08)]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Available now</p>
                  <span className="rounded-full border border-stone-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">
                    Bundle
                  </span>
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl leading-none tracking-[-0.03em] text-stone-950">Bundle</h2>
                  <p className="text-sm leading-7 text-stone-600">
                    One public sales page and one checkout flow that unlock multiple existing courses at once.
                  </p>
                </div>
                <ul className="space-y-2 text-sm leading-7 text-stone-600">
                  <li>One bundle offer</li>
                  <li>Multiple course enrollments on payment success</li>
                  <li>Same learner dashboard after unlock</li>
                </ul>
              </Card>
            </Link>
          </div>
        </div>

        <Card className="space-y-5 p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Deferred product types</p>
          <div className="space-y-4">
            {[
              {
                title: "Digital Product",
                copy: "Deferred until the platform supports non-course fulfillment without forcing course-first assumptions.",
              },
              {
                title: "Event",
                copy: "Deferred until scheduling, attendance, and event-specific delivery are designed as first-class flows.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-dashed border-stone-300 bg-stone-50/80 p-5">
                <h3 className="text-2xl leading-none tracking-[-0.03em] text-stone-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">{item.copy}</p>
              </div>
            ))}
          </div>
          <p className="text-sm leading-7 text-stone-600">
            This keeps the product system honest: only sellable shapes with complete fulfillment logic are exposed as real creation
            paths.
          </p>
        </Card>
      </div>
    </AdminShell>
  );
}
