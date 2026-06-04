import { CourseStatus } from "@prisma/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminActionBar, AdminDataTable, AdminStat, AdminStatusBadge, adminSecondaryButtonClass } from "@/components/admin/admin-ui";
import { HardLink } from "@/components/ui/hard-link";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryOffer } from "@/lib/offers/sync-product-offer";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";

export const dynamic = "force-dynamic";

type ReadinessTone = "success" | "warning" | "danger";

function getReadinessTone(blockers: string[], warnings: string[]): ReadinessTone {
  if (blockers.length > 0) return "danger";
  if (warnings.length > 0) return "warning";
  return "success";
}

function getReadinessLabel(tone: ReadinessTone) {
  if (tone === "success") return "Ready";
  if (tone === "warning") return "Needs check";
  return "Blocked";
}

export default async function MigrationReadinessPage() {
  const courses = await prisma.course.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      heroImageUrl: true,
      salesVideoUrl: true,
      publicPath: true,
      legacyUrl: true,
      updatedAt: true,
      modules: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          lessons: {
            select: {
              id: true,
              isPreview: true,
            },
          },
        },
      },
      collectionCourses: {
        select: {
          collection: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },
      testimonials: {
        select: {
          id: true,
          isApproved: true,
        },
      },
      accessProduct: {
        select: {
          id: true,
          title: true,
          status: true,
          offers: {
            select: {
              id: true,
              isDefault: true,
              isPublished: true,
              price: true,
              currency: true,
              prices: {
                select: {
                  amount: true,
                  currency: true,
                },
              },
            },
          },
        },
      },
      offers: {
        select: {
          id: true,
          isDefault: true,
          isPublished: true,
          price: true,
          currency: true,
          prices: {
            select: {
              amount: true,
              currency: true,
            },
          },
        },
      },
    },
  });

  const rows = courses.map((course) => {
    const moduleCount = course.modules.length;
    const lessonCount = course.modules.reduce((total, module) => total + module.lessons.length, 0);
    const previewCount = course.modules.reduce((total, module) => total + module.lessons.filter((lesson) => lesson.isPreview).length, 0);
    const collections = course.collectionCourses.map((item) => item.collection.title);
    const productOffers = course.accessProduct?.offers ?? [];
    const primaryOffer = getPrimaryOffer(productOffers.length > 0 ? productOffers : course.offers);
    const price = primaryOffer?.prices[0]?.amount ?? primaryOffer?.price ?? null;
    const currency = primaryOffer?.prices[0]?.currency ?? primaryOffer?.currency ?? "USD";
    const publicHref = resolveCoursePublicPath(course);

    const blockers = [
      ...(moduleCount === 0 ? ["No modules"] : []),
      ...(lessonCount === 0 ? ["No lessons"] : []),
      ...(!course.accessProduct ? ["No product"] : []),
      ...(!primaryOffer ? ["No offer"] : []),
      ...(primaryOffer && !primaryOffer.isPublished ? ["Offer hidden"] : []),
      ...(!course.publicPath && !course.legacyUrl ? ["No public route"] : []),
    ];
    const warnings = [
      ...(course.status !== CourseStatus.PUBLISHED ? ["Draft"] : []),
      ...(!course.heroImageUrl ? ["No hero image"] : []),
      ...(!course.salesVideoUrl ? ["No sales video"] : []),
      ...(collections.length === 0 ? ["No collection"] : []),
      ...(previewCount === 0 ? ["No preview"] : []),
    ];
    const tone = getReadinessTone(blockers, warnings);

    return {
      course,
      moduleCount,
      lessonCount,
      previewCount,
      collections,
      primaryOffer,
      price,
      currency,
      publicHref,
      blockers,
      warnings,
      tone,
    };
  });

  const readyCount = rows.filter((row) => row.tone === "success").length;
  const needsCheckCount = rows.filter((row) => row.tone === "warning").length;
  const blockedCount = rows.filter((row) => row.tone === "danger").length;
  const importedLikeCount = rows.filter((row) => row.course.legacyUrl || row.course.publicPath?.startsWith("/b/")).length;
  const missingImageCount = rows.filter((row) => !row.course.heroImageUrl).length;
  const missingOfferCount = rows.filter((row) => !row.primaryOffer).length;

  return (
    <AdminShell title="Migration readiness" description="Scan imported Payhip-style courses before treating them as fully migrated.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <AdminStat label="Courses" value={courses.length} detail={`${importedLikeCount} with legacy-style route data`} />
        <AdminStat label="Ready" value={readyCount} detail="No blocking or warning checks" tone={readyCount === courses.length && courses.length > 0 ? "success" : "neutral"} />
        <AdminStat label="Needs check" value={needsCheckCount} detail="Usable but missing migration polish" tone={needsCheckCount > 0 ? "warning" : "success"} />
        <AdminStat label="Blocked" value={blockedCount} detail="Missing required selling/access setup" tone={blockedCount > 0 ? "danger" : "success"} />
        <AdminStat label="Missing images" value={missingImageCount} detail="Hero image not set" tone={missingImageCount > 0 ? "warning" : "success"} />
        <AdminStat label="Missing offers" value={missingOfferCount} detail="Checkout offer not found" tone={missingOfferCount > 0 ? "danger" : "success"} />
      </div>

      <AdminDataTable
        columns={[
          { header: "Course" },
          { header: "Readiness" },
          { header: "Curriculum" },
          { header: "Media" },
          { header: "Product" },
          { header: "Collection" },
          { header: "Actions" },
        ]}
        rows={rows.map((row) => ({
          key: row.course.id,
          cells: [
            <div key="course" className="max-w-sm space-y-1">
              <p className="font-semibold text-[var(--text-primary)]">{row.course.title}</p>
              <p className="text-xs text-[var(--text-secondary)]">{row.course.publicPath ?? row.course.legacyUrl ?? `/course/${row.course.slug}`}</p>
            </div>,
            <div key="readiness" className="space-y-2">
              <AdminStatusBadge tone={row.tone}>{getReadinessLabel(row.tone)}</AdminStatusBadge>
              {row.blockers.length > 0 || row.warnings.length > 0 ? (
                <p className="max-w-xs text-xs leading-5 text-[var(--text-secondary)]">{[...row.blockers, ...row.warnings].join(", ")}</p>
              ) : (
                <p className="text-xs text-[var(--text-secondary)]">Ready for course QA.</p>
              )}
            </div>,
            <div key="curriculum" className="space-y-1 text-sm">
              <p>{row.moduleCount} modules / {row.lessonCount} lessons</p>
              <p className="text-xs text-[var(--text-secondary)]">{row.previewCount} preview lesson{row.previewCount === 1 ? "" : "s"}</p>
            </div>,
            <div key="media" className="flex flex-wrap gap-2">
              <AdminStatusBadge tone={row.course.heroImageUrl ? "success" : "warning"}>{row.course.heroImageUrl ? "Hero" : "No hero"}</AdminStatusBadge>
              <AdminStatusBadge tone={row.course.salesVideoUrl ? "success" : "neutral"}>{row.course.salesVideoUrl ? "Video" : "No video"}</AdminStatusBadge>
            </div>,
            <div key="product" className="space-y-1 text-sm">
              <p>{row.course.accessProduct ? "Product linked" : "No product"}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {row.primaryOffer ? `${row.primaryOffer.isPublished ? "Published" : "Hidden"} offer / ${row.price !== null ? `${row.price.toString()} ${row.currency}` : "No price"}` : "No checkout offer"}
              </p>
            </div>,
            row.collections.length > 0 ? row.collections.join(", ") : "No collection",
            <AdminActionBar key="actions">
              <HardLink href={`/admin/courses/${row.course.id}`} className={adminSecondaryButtonClass}>
                Edit
              </HardLink>
              {row.course.accessProduct ? (
                <HardLink href={`/admin/products/${row.course.accessProduct.id}`} className={adminSecondaryButtonClass}>
                  Product
                </HardLink>
              ) : null}
              <HardLink href={row.publicHref} className={adminSecondaryButtonClass}>
                View
              </HardLink>
            </AdminActionBar>,
          ],
        }))}
        empty="No courses found."
      />
    </AdminShell>
  );
}
