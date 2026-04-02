import Link from "next/link";
import type { Course } from "@prisma/client";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";

export function CourseCard({ course }: { course: Pick<Course, "title" | "slug" | "subtitle" | "heroImageUrl" | "publicPath" | "legacyUrl"> }) {
  return (
    <Link href={resolveCoursePublicPath(course)} className="group block">
      <article className="h-full overflow-hidden rounded-[34px] border border-[var(--border)] bg-[rgba(255,252,247,0.7)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(23,20,18,0.12)]">
        <div
          className="h-80 bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
          style={{
            backgroundImage: course.heroImageUrl
              ? `linear-gradient(135deg, rgba(17, 24, 39, 0.4), rgba(120, 53, 15, 0.15)), url(${course.heroImageUrl})`
              : "linear-gradient(135deg, #1c1917, #f59e0b)",
          }}
        />
        <div className="space-y-4 p-7">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Generated sales page</p>
            <span className="text-sm font-semibold text-stone-700 transition group-hover:translate-x-1">Open</span>
          </div>
          <h3 className="max-w-sm text-4xl leading-none tracking-[-0.04em] text-stone-950">{course.title}</h3>
          {course.subtitle ? <p className="max-w-sm text-sm leading-7 text-stone-600">{course.subtitle}</p> : null}
        </div>
      </article>
    </Link>
  );
}
