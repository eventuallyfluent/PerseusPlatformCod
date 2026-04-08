import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { resolveCollectionPublicPath } from "@/lib/urls/resolve-collection-path";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    include: {
      courses: true,
    },
    orderBy: [{ position: "asc" }, { title: "asc" }],
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto max-w-4xl space-y-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--accent-lavender)]">Collections</p>
        <h1 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--portal-text)]">Study by collection</h1>
        <p className="text-lg leading-8 text-[var(--foreground-soft)]">Each collection groups specific courses into one public path with its own image, description, and study direction.</p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={resolveCollectionPublicPath(collection)}
            className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)]"
          >
            <div
              className="min-h-[220px] border-b border-[var(--border)] px-7 py-7"
              style={{
                backgroundImage: collection.imageUrl
                  ? `linear-gradient(180deg, rgba(13,15,29,0.36), rgba(13,15,29,0.74)), url(${collection.imageUrl})`
                  : "var(--collection-arcane)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {collection.eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[rgba(240,234,248,0.76)]">{collection.eyebrow}</p> : null}
              <h2 className="mt-5 font-serif text-4xl leading-none tracking-[-0.04em] text-[var(--portal-text)]">{collection.title}</h2>
              <p className="mt-5 text-base leading-8 text-[rgba(240,234,248,0.76)]">{collection.description}</p>
            </div>
            <div className="p-6 text-sm leading-7 text-[var(--foreground-soft)]">
              {collection.courses.length} course{collection.courses.length === 1 ? "" : "s"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
