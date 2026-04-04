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
  return (
    <Link href={resolveCoursePublicPath(course)} className="group block">
      <article className="h-full overflow-hidden rounded-[34px] border border-[var(--border)] bg-[rgba(20,18,39,0.96)] text-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(21,26,45,0.16)]">
        <div
          className="h-72 bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
          style={{
            backgroundImage: course.heroImageUrl
              ? `linear-gradient(180deg, rgba(15, 16, 32, 0.22), rgba(15, 16, 32, 0.58)), url(${course.heroImageUrl})`
              : "linear-gradient(135deg, #29104a, #1f4ab8)",
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
            {course.subtitle ? <p className="max-w-sm text-base leading-8 text-[#bdb3da]">{course.subtitle}</p> : null}
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-[var(--portal-border)] pt-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--portal-muted)]">Access path</p>
              <p className="mt-2 text-3xl font-semibold">{course.priceLabel ?? "View offer"}</p>
            </div>
            <span className="rounded-full border border-[rgba(143,44,255,0.55)] px-5 py-3 text-sm font-semibold text-[#c18cff] transition group-hover:bg-[rgba(143,44,255,0.1)]">
              {course.ctaLabel ?? "Enroll now"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
