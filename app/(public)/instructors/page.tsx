import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function InstructorsIndexPage() {
  const instructors = await prisma.instructor.findMany({
    orderBy: { name: "asc" },
    include: {
      courses: {
        where: { status: "PUBLISHED" },
        select: { id: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto max-w-4xl space-y-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--accent-lavender)]">Instructors</p>
        <h1 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--portal-text)]">Meet the guides behind the work.</h1>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {instructors.map((instructor) => (
          <Link
            key={instructor.id}
            href={`/instructors/${instructor.slug}`}
            className="rounded-[30px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] p-7 shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)]"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {instructor.imageUrl ? (
                <div
                  className="h-28 w-28 shrink-0 rounded-[24px] bg-cover bg-center"
                  style={{ backgroundImage: `url(${instructor.imageUrl})` }}
                />
              ) : (
                <div className="h-28 w-28 shrink-0 rounded-[24px] bg-[linear-gradient(135deg,#34105f,#5e2da1)]" />
              )}
              <div className="space-y-3">
                <h2 className="text-3xl leading-none tracking-[-0.03em] text-[var(--portal-text)]">{instructor.name}</h2>
                {instructor.shortBio ? <p className="text-sm leading-8 text-[var(--foreground-soft)]">{instructor.shortBio}</p> : null}
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent-lavender)]">
                  {instructor.courses.length} published course{instructor.courses.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
