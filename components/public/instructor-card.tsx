import Link from "next/link";
import type { Instructor } from "@prisma/client";

export function InstructorCard({ instructor }: { instructor: Pick<Instructor, "slug" | "name" | "shortBio" | "imageUrl"> }) {
  return (
    <Link href={`/instructors/${instructor.slug}`} className="group block">
      <article className="h-full overflow-hidden rounded-[32px] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(23,20,18,0.11)]">
        <div
          className="h-60 bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
          style={{
            backgroundImage: instructor.imageUrl
              ? `linear-gradient(135deg, rgba(17, 24, 39, 0.3), rgba(120, 53, 15, 0.2)), url(${instructor.imageUrl})`
              : "linear-gradient(135deg, #292524, #facc15)",
          }}
        />
        <div className="space-y-3 p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Instructor</p>
          <h3 className="text-4xl leading-none tracking-[-0.04em] text-stone-950">{instructor.name}</h3>
          {instructor.shortBio ? <p className="text-sm leading-7 text-stone-600">{instructor.shortBio}</p> : null}
        </div>
      </article>
    </Link>
  );
}
