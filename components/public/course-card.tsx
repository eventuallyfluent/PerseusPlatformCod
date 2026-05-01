import type { Course } from "@prisma/client";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
import { Badge } from "@/components/ui/badge";
import { HardLink } from "@/components/ui/hard-link";

type CourseCardProps = {
  course: Pick<Course, "title" | "slug" | "subtitle" | "heroImageUrl" | "publicPath" | "legacyUrl"> & {
    priceLabel?: string | null;
    statusLabel?: string | null;
    ctaLabel?: string | null;
    instructorName?: string | null;
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
    <HardLink href={resolveCoursePublicPath(course)} className="group block">
      <article className="perseus-course-card flex h-full flex-col overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--surface-panel)] text-[var(--text-primary)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-panel)]">
        <div
          className="perseus-course-card-media h-72 bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
          style={{
            backgroundImage: course.heroImageUrl
              ? `linear-gradient(180deg, rgba(15, 16, 32, 0.2), rgba(15, 16, 32, 0.58)), url(${course.heroImageUrl})`
              : cardTone,
          }}
        />
        <div className="perseus-course-card-body flex flex-1 flex-col p-7">
          <div className="perseus-course-card-badges flex items-center justify-between gap-4">
            <Badge variant="portal">{course.statusLabel ?? "Featured"}</Badge>
            <Badge variant="premium">{course.priceLabel?.toLowerCase() === "free" ? "Free" : "Premium"}</Badge>
          </div>
          <div className="perseus-course-card-copy mt-5 space-y-3">
            {course.instructorName ? <p className="text-sm text-[var(--text-secondary)]">{course.instructorName}</p> : null}
            <h3
              className="max-w-sm min-h-[7.5rem] text-4xl leading-none tracking-[-0.04em] text-[var(--text-primary)]"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {course.title}
            </h3>
            {course.subtitle ? (
              <p
                className="max-w-sm min-h-[4rem] text-base leading-8 text-[var(--text-secondary)]"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {course.subtitle}
              </p>
            ) : (
              <div className="min-h-[4rem]" />
            )}
          </div>
          <div className="perseus-course-card-footer mt-auto flex items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-secondary)]">Access path</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{course.priceLabel ?? "View offer"}</p>
            </div>
            <span className="rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-5 py-3 text-sm font-semibold text-[var(--accent)] transition group-hover:bg-[var(--surface-panel-strong)]">
              {course.ctaLabel ?? "Enroll now"}
            </span>
          </div>
        </div>
      </article>
    </HardLink>
  );
}
