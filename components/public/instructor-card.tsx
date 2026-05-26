import Link from "next/link";
import Image from "next/image";
import type { Instructor } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

export function InstructorCard({ instructor }: { instructor: Pick<Instructor, "slug" | "name" | "shortBio" | "imageUrl"> }) {
  return (
    <Link href={`/instructors/${instructor.slug}`} className="group block">
      <article className="perseus-card h-full overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface-panel)] shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-panel)]">
        <div className="relative h-60 overflow-hidden bg-[linear-gradient(135deg,#ede7ff,#fff6db)]">
          {instructor.imageUrl ? (
            <>
              <Image
                src={instructor.imageUrl}
                alt={`${instructor.name} portrait`}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
              />
              <span className="absolute inset-0 bg-gradient-to-br from-slate-900/20 to-amber-900/10" />
            </>
          ) : null}
        </div>
        <div className="space-y-3 p-7">
          <Badge variant="muted">Instructor</Badge>
          <h3 className="font-serif text-4xl leading-tight text-[var(--foreground)]">{instructor.name}</h3>
          {instructor.shortBio ? <p className="text-sm leading-7 text-[var(--foreground-soft)]">{instructor.shortBio}</p> : null}
        </div>
      </article>
    </Link>
  );
}
