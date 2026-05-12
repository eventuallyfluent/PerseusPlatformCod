import Link from "next/link";
import type { Instructor } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { PublicSmartImage } from "@/components/public/public-smart-image";

export function InstructorCard({ instructor }: { instructor: Pick<Instructor, "slug" | "name" | "shortBio" | "imageUrl"> }) {
  return (
    <Link href={`/instructors/${instructor.slug}`} className="group block">
      <article className="perseus-card h-full overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel)] shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-panel)]">
        <PublicSmartImage
          src={instructor.imageUrl}
          alt={`${instructor.name} portrait`}
          variant="portrait"
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
          className="h-60"
          imageClassName="group-hover:scale-[1.02]"
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
