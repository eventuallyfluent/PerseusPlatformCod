import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { CourseCard } from "@/components/public/course-card";
import { HardLink } from "@/components/ui/hard-link";
import { resolveCollectionPublicPath } from "@/lib/urls/resolve-collection-path";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbStructuredData, buildItemListStructuredData } from "@/lib/seo/structured-data";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";

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

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = normalizeSearchParam(params.q);
  const collection = normalizeSearchParam(params.collection);
  const instructor = normalizeSearchParam(params.instructor);
  const sort = normalizeSearchParam(params.sort);
  const hasFilters = Boolean(query || collection || instructor || (sort && sort !== "newest"));

  return buildMetadata({
    title: "Courses",
    description: "Browse the public course catalog by course, instructor, or collection.",
    path: "/courses",
    noIndex: hasFilters,
  });
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
        imageUrl: true,
        description: true,
        _count: {
          select: {
            courses: true,
          },
        },
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

  const breadcrumbJsonLd = buildBreadcrumbStructuredData([
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses" },
  ]);
  const itemListJsonLd = buildItemListStructuredData({
    name: "Courses",
    path: "/courses",
    items: courses.map((course) => ({
      name: course.title,
      path: resolveCoursePublicPath(course),
    })),
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <div className="mx-auto max-w-4xl space-y-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--accent-lavender)]">Courses</p>
        <h1 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--portal-text)]">Browse by course, collection, or instructor.</h1>
        <p className="text-lg leading-8 text-[var(--foreground-soft)]">
          Use search and filters to move through the full store without forcing everything into one long list.
        </p>
      </div>

      <section className="mt-10 space-y-6">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 text-sm text-[var(--portal-text)]">
          <HardLink
            href="/courses"
            className={`font-medium transition ${selectedCollection ? "text-[var(--foreground-soft)] hover:text-[var(--portal-text)]" : "text-[var(--accent-lavender)] underline underline-offset-4"}`}
          >
            All Courses
          </HardLink>
          {collections.map((collection) => {
            const active = selectedCollection?.id === collection.id;

            return (
              <HardLink
                key={collection.id}
                href={resolveCollectionPublicPath(collection)}
                className={`font-medium transition ${active ? "text-[var(--accent-lavender)] underline underline-offset-4" : "text-[var(--foreground-soft)] hover:text-[var(--portal-text)]"}`}
              >
                {collection.title}
              </HardLink>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => {
            const active = selectedCollection?.id === collection.id;

            return (
              <HardLink
                key={collection.id}
                href={resolveCollectionPublicPath(collection)}
                className="group block"
              >
                <article
                  className={`overflow-hidden rounded-[30px] border bg-[var(--perseus-collection-panel)] shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 ${
                    active ? "border-[var(--accent)]" : "border-[var(--border)]"
                  }`}
                >
                  <div
                    className="h-52 bg-cover bg-center"
                    style={{
                      backgroundImage: collection.imageUrl
                        ? `linear-gradient(180deg, rgba(13,15,29,0.18), rgba(13,15,29,0.62)), url(${collection.imageUrl})`
                        : "linear-gradient(135deg,#1c1534,#302555)",
                    }}
                  />
                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-2xl leading-none tracking-[-0.03em] text-[var(--portal-text)]">{collection.title}</h2>
                      <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-soft)]">
                        {collection._count.courses} course{collection._count.courses === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p
                      className="min-h-[3.5rem] text-sm leading-7 text-[var(--foreground-soft)]"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {collection.description || "Browse the full collection."}
                    </p>
                    <p className="text-sm font-semibold text-[var(--accent-lavender)]">{active ? "Viewing collection" : "Open collection"}</p>
                  </div>
                </article>
              </HardLink>
            );
          })}
        </div>
      </section>

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
          <button className="rounded-full bg-[var(--button-primary-background)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--button-primary-shadow)] transition hover:bg-[var(--button-primary-hover)]" type="submit">
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
