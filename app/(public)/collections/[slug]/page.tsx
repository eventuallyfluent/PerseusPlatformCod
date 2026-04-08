import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";

export const dynamic = "force-dynamic";

function formatPrice(amount: string | number, currency: string) {
  const numericAmount = typeof amount === "number" ? amount : Number(amount);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
  }).format(numericAmount);
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      courses: {
        orderBy: { position: "asc" },
        include: {
          course: true,
        },
      },
    },
  });

  if (!collection) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <section
        className="overflow-hidden rounded-[34px] border border-[var(--border)] px-8 py-10 shadow-[var(--shadow-soft)] sm:px-10 lg:px-14"
        style={{
          backgroundImage: collection.imageUrl
            ? `linear-gradient(180deg, rgba(13,15,29,0.42), rgba(13,15,29,0.82)), url(${collection.imageUrl})`
            : "var(--collection-arcane)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {collection.eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--accent-lavender)]">{collection.eyebrow}</p> : null}
        <h1 className="mt-4 font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--portal-text)]">{collection.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--foreground-soft)]">{collection.description}</p>
      </section>

      <section className="mt-10 space-y-5">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-lavender)]">Courses in this collection</p>
          <h2 className="font-serif text-4xl leading-none tracking-[-0.04em] text-[var(--portal-text)]">Choose your course</h2>
        </div>
        <div className="grid gap-4">
          {collection.courses.map(({ course }) => (
            <Link
              key={course.id}
              href={resolveCoursePublicPath(course)}
              className="flex items-start justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] p-5 transition hover:border-[var(--border-strong)]"
            >
              <div className="space-y-2">
                <h3 className="text-2xl leading-none tracking-[-0.03em] text-[var(--portal-text)]">{course.title}</h3>
                {course.subtitle ? <p className="max-w-2xl text-sm leading-7 text-[var(--foreground-soft)]">{course.subtitle}</p> : null}
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-[var(--portal-text)]">{formatPrice(course.price.toString(), course.currency)}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--accent-lavender)]">View course</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
