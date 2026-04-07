import { prisma } from "@/lib/db/prisma";
import { CourseCard } from "@/components/public/course-card";

export const dynamic = "force-dynamic";

export default async function CoursesIndexPage() {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    include: {
      instructor: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto max-w-4xl space-y-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--accent-lavender)]">Courses</p>
        <h1 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--portal-text)]">Enter through the course that fits your line of study.</h1>
        <p className="text-lg leading-8 text-[var(--foreground-soft)]">
          Browse every published Perseus course and choose the work you want to begin or continue.
        </p>
      </div>

      {courses.length > 0 ? (
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={{
                ...course,
                priceLabel: new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: course.currency,
                  maximumFractionDigits: Number(course.price) % 1 === 0 ? 0 : 2,
                }).format(Number(course.price)),
              }}
            />
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-12 max-w-3xl rounded-[30px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] p-8 text-center text-lg leading-8 text-[var(--foreground-soft)] shadow-[var(--shadow-soft)]">
          No published courses yet.
        </div>
      )}
    </div>
  );
}
