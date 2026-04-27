import Link from "next/link";
import type { Instructor } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

export function InstructorCard({ instructor }: { instructor: Pick<Instructor, "slug" | "name" | "shortBio" | "imageUrl"> }) {
  return (
    <Link href={`/instructors/${instructor.slug}`} className="group block">
      <article className="perseus-card h-full overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--surface-panel)] shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-panel)]">
        <div
          className="h-60 bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
          style={{
            backgroundImage: instructor.imageUrl
              ? `linear-gradient(135deg, rgba(17, 24, 39, 0.18), rgba(120, 53, 15, 0.08)), url(${instructor.imageUrl})`
              : "linear-gradient(135deg, #ede7ff, #fff6db)",
          }}
        />
        <div className="space-y-3 p-7">
          <Badge variant="muted">Instructor</Badge>
          <h3 className="text-4xl leading-none tracking-[-0.04em] text-[var(--foreground)]">{instructor.name}</h3>
          {instructor.shortBio ? <p className="text-sm leading-7 text-[var(--foreground-soft)]">{instructor.shortBio}</p> : null}
        </div>
      </article>
    </Link>
  );
}
