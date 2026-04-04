import Link from "next/link";
import type { Course } from "@prisma/client";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
import { Badge } from "@/components/ui/badge";

type CourseCardProps = {
  course: Pick<Course, "title" | "slug" | "subtitle" | "heroImageUrl" | "publicPath" | "legacyUrl"> & {
    priceLabel?: string | null;
    statusLabel?: string | null;
    ctaLabel?: string | null;
  };
};

export function CourseCard({ course }: CourseCardProps) {
  const cardTone =
    course.priceLabel?.toLowerCase() === "free"
      ? "linear-gradient(135deg, #0c5f45, #158f6b)"
      : course.statusLabel?.toLowerCase() === "featured"
        ? "linear-gradient(135deg, #34105f, #5e2da1)"
        : "linear-gradient(135deg, #17396f, #2758a5)";

  return (
    <Link href={resolveCoursePublicPath(course)} className="group block">
      <article className="h-full overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--portal-panel-strong)] text-white transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
        <div
          className="h-72 bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
          style={{
            backgroundImage: course.heroImageUrl
              ? `linear-gradient(180deg, rgba(15, 16, 32, 0.2), rgba(15, 16, 32, 0.58)), url(${course.heroImageUrl})`
              : cardTone,
          }}
        />
        <div className="space-y-5 p-7">
          <div className="flex items-center justify-between gap-4">
            <Badge variant="portal">{course.statusLabel ?? "Featured"}</Badge>
            <Badge variant="premium">{course.priceLabel?.toLowerCase() === "free" ? "Free" : "Premium"}</Badge>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-[var(--portal-muted)]">Perseus course</p>
            <h3 className="max-w-sm text-4xl leading-none tracking-[-0.04em]">{course.title}</h3>
            {course.subtitle ? <p className="max-w-sm text-base leading-8 text-[var(--portal-muted)]">{course.subtitle}</p> : null}
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-[var(--portal-border)] pt-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--portal-muted)]">Access path</p>
              <p className="mt-2 text-3xl font-semibold">{course.priceLabel ?? "View offer"}</p>
            </div>
            <span className="rounded-full border border-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-lavender)] transition group-hover:bg-[var(--accent-soft)]">
              {course.ctaLabel ?? "Enroll now"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
