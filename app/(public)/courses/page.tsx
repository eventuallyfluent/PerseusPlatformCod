import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { CourseCard } from "@/components/public/course-card";

export const dynamic = "force-dynamic";

function formatPriceLabel(amount: string | number, currency: string) {
  const numericAmount = typeof amount === "number" ? amount : Number(amount);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
  }).format(numericAmount);
}

function normalizeSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function CoursesIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = normalizeSearchParam(params.q);
  const collectionSlug = normalizeSearchParam(params.collection);
  const instructorSlug = normalizeSearchParam(params.instructor);
  const sort = normalizeSearchParam(params.sort) || "newest";

  const [collections, instructors] = await Promise.all([
    prisma.collection.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
      },
    }),
    prisma.instructor.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    }),
  ]);

  const selectedCollection = collectionSlug ? collections.find((collection) => collection.slug === collectionSlug) ?? null : null;
  const selectedInstructor = instructorSlug ? instructors.find((instructor) => instructor.slug === instructorSlug) ?? null : null;

  const courses = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { subtitle: { contains: query, mode: "insensitive" } },
              { shortDescription: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(selectedCollection
        ? {
            collectionCourses: {
              some: {
                collection: {
                  slug: selectedCollection.slug,
                },
              },
            },
          }
        : {}),
      ...(selectedInstructor
        ? {
            instructor: {
              slug: selectedInstructor.slug,
            },
          }
        : {}),
    },
    include: {
      instructor: true,
      collectionCourses: {
        include: {
          collection: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
    orderBy:
      sort === "title"
        ? { title: "asc" }
        : sort === "price-low"
          ? { price: "asc" }
          : sort === "price-high"
            ? { price: "desc" }
            : { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto max-w-4xl space-y-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--accent-lavender)]">Courses</p>
        <h1 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--portal-text)]">Browse by course, collection, or instructor.</h1>
        <p className="text-lg leading-8 text-[var(--foreground-soft)]">
          Use search and filters to move through the full store without forcing everything into one long list.
        </p>
      </div>

      <form className="mt-10 rounded-[30px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] p-6 shadow-[var(--shadow-soft)]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_220px]">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--portal-text)]">Search courses</span>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search title or description"
              className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--perseus-collection-elevated)] px-4 py-3 text-sm text-[var(--portal-text)] outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--portal-text)]">Collection</span>
            <select
              name="collection"
              defaultValue={selectedCollection?.slug ?? ""}
              className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--perseus-collection-elevated)] px-4 py-3 text-sm text-[var(--portal-text)] outline-none transition focus:border-[var(--accent)]"
            >
              <option value="">All collections</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.slug}>
                  {collection.title}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--portal-text)]">Instructor</span>
            <select
              name="instructor"
              defaultValue={selectedInstructor?.slug ?? ""}
              className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--perseus-collection-elevated)] px-4 py-3 text-sm text-[var(--portal-text)] outline-none transition focus:border-[var(--accent)]"
            >
              <option value="">All instructors</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.slug}>
                  {instructor.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--portal-text)]">Sort</span>
            <select
              name="sort"
              defaultValue={sort}
              className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--perseus-collection-elevated)] px-4 py-3 text-sm text-[var(--portal-text)] outline-none transition focus:border-[var(--accent)]"
            >
              <option value="newest">Newest</option>
              <option value="title">Title</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(143,44,255,0.18)]" type="submit">
            Update results
          </button>
          <Link href="/courses" className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--portal-text)]">
            Clear filters
          </Link>
          <span className="text-sm text-[var(--foreground-soft)]">
            {courses.length} course{courses.length === 1 ? "" : "s"}
          </span>
        </div>
      </form>

      {(selectedCollection || selectedInstructor || query) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {selectedCollection ? (
            <span className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent-lavender)]">
              Collection: {selectedCollection.title}
            </span>
          ) : null}
          {selectedInstructor ? (
            <span className="rounded-full bg-[var(--premium-soft)] px-4 py-2 text-sm font-semibold text-[var(--premium)]">
              Instructor: {selectedInstructor.name}
            </span>
          ) : null}
          {query ? (
            <span className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--portal-text)]">
              Search: {query}
            </span>
          ) : null}
        </div>
      )}

      {courses.length > 0 ? (
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <div key={course.id} className="space-y-3">
              <CourseCard
                course={{
                  ...course,
                  priceLabel: formatPriceLabel(course.price.toString(), course.currency),
                }}
              />
              <div className="flex flex-wrap gap-2 px-1">
                <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-soft)]">
                  {course.instructor.name}
                </span>
                {course.collectionCourses.map(({ collection }) => (
                  <Link
                    key={collection.id}
                    href={`/courses?collection=${encodeURIComponent(collection.slug)}`}
                    className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-lavender)]"
                  >
                    {collection.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-12 max-w-3xl rounded-[30px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] p-8 text-center text-lg leading-8 text-[var(--foreground-soft)] shadow-[var(--shadow-soft)]">
          No published courses matched the current search and filters.
        </div>
      )}
    </div>
  );
}
