import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbStructuredData, buildItemListStructuredData } from "@/lib/seo/structured-data";
import { PublicSmartImage } from "@/components/public/public-smart-image";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildMetadata({
  title: "Instructors",
  description: "Browse Perseus Arcane Academy instructors and the public courses they teach.",
  path: "/instructors",
});

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

  const breadcrumbJsonLd = buildBreadcrumbStructuredData([
    { name: "Home", path: "/" },
    { name: "Instructors", path: "/instructors" },
  ]);
  const itemListJsonLd = buildItemListStructuredData({
    name: "Instructors",
    path: "/instructors",
    items: instructors.map((instructor) => ({
      name: instructor.name,
      path: `/instructors/${instructor.slug}`,
    })),
  });

  return (
    <div className="mx-auto max-w-7xl overflow-x-hidden px-5 py-14 sm:px-6 lg:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <div className="mx-auto max-w-4xl space-y-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--accent-lavender)]">Instructors</p>
        <h1 className="font-serif text-4xl leading-none tracking-[-0.04em] text-[var(--portal-text)] sm:text-5xl">Meet the guides behind the work.</h1>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {instructors.map((instructor) => (
          <Link
            key={instructor.id}
            href={`/instructors/${instructor.slug}`}
            className="rounded-[24px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:border-[var(--border-strong)] sm:p-6"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <PublicSmartImage
                src={instructor.imageUrl}
                alt={`${instructor.name} portrait`}
                variant="portrait"
                sizes="112px"
                className="aspect-square w-28 shrink-0 rounded-[20px]"
              />
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
