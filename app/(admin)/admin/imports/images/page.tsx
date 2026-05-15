import Link from "next/link";
import { ImageAssetStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminDataTable, AdminStatusBadge, adminSecondaryButtonClass } from "@/components/admin/admin-ui";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function statusTone(status: ImageAssetStatus) {
  if (status === ImageAssetStatus.COPIED) return "success" as const;
  if (status === ImageAssetStatus.FAILED) return "danger" as const;
  if (status === ImageAssetStatus.PENDING) return "warning" as const;
  return "neutral" as const;
}

function isPayhipUrl(value?: string | null) {
  return Boolean(value?.includes("payhip.com"));
}

function readGalleryUrls(config: unknown) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return [];
  }

  const urls = (config as Record<string, unknown>).galleryImageUrls;
  return Array.isArray(urls) ? urls.map((url) => String(url)).filter(Boolean) : [];
}

export default async function ImportedImagesPage() {
  const [statusCounts, assets, courses, bundles, instructors, collections] = await Promise.all([
    prisma.imageAsset.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.imageAsset.findMany({
      where: {
        OR: [{ status: ImageAssetStatus.FAILED }, { sourceUrl: { contains: "payhip.com" } }],
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.course.findMany({ select: { id: true, title: true, slug: true, heroImageUrl: true, salesPageConfig: true } }),
    prisma.bundle.findMany({ select: { id: true, title: true, slug: true, heroImageUrl: true, salesPageConfig: true } }),
    prisma.instructor.findMany({ select: { id: true, name: true, slug: true, imageUrl: true } }),
    prisma.collection.findMany({ select: { id: true, title: true, slug: true, imageUrl: true } }),
  ]);
  const counts = Object.fromEntries(statusCounts.map((item) => [item.status, item._count._all]));
  const oldReferences = [
    ...courses.flatMap((course) => [
      ...(isPayhipUrl(course.heroImageUrl) ? [{ key: `course-${course.id}`, type: "Course hero", title: course.title, href: `/admin/courses/${course.id}`, url: course.heroImageUrl ?? "" }] : []),
      ...readGalleryUrls(course.salesPageConfig)
        .filter(isPayhipUrl)
        .map((url, index) => ({ key: `course-gallery-${course.id}-${index}`, type: "Course gallery", title: course.title, href: `/admin/courses/${course.id}`, url })),
    ]),
    ...bundles.flatMap((bundle) => [
      ...(isPayhipUrl(bundle.heroImageUrl) ? [{ key: `bundle-${bundle.id}`, type: "Bundle hero", title: bundle.title, href: `/admin/bundles/${bundle.id}`, url: bundle.heroImageUrl ?? "" }] : []),
      ...readGalleryUrls(bundle.salesPageConfig)
        .filter(isPayhipUrl)
        .map((url, index) => ({ key: `bundle-gallery-${bundle.id}-${index}`, type: "Bundle gallery", title: bundle.title, href: `/admin/bundles/${bundle.id}`, url })),
    ]),
    ...instructors
      .filter((instructor) => isPayhipUrl(instructor.imageUrl))
      .map((instructor) => ({ key: `instructor-${instructor.id}`, type: "Instructor", title: instructor.name, href: `/admin/instructors/${instructor.id}`, url: instructor.imageUrl ?? "" })),
    ...collections
      .filter((collection) => isPayhipUrl(collection.imageUrl))
      .map((collection) => ({ key: `collection-${collection.id}`, type: "Collection", title: collection.title, href: `/admin/collections/${collection.id}`, url: collection.imageUrl ?? "" })),
  ];

  return (
    <AdminShell title="Imported images" description="Track remote image ownership, failed copies, and Payhip image URLs still referenced by the app.">
      <div className="grid gap-4 md:grid-cols-4">
        {Object.values(ImageAssetStatus).map((status) => (
          <Card key={status} className="space-y-2 bg-white">
            <AdminStatusBadge tone={statusTone(status)}>{status}</AdminStatusBadge>
            <p className="text-3xl font-semibold text-stone-950">{Number(counts[status] ?? 0)}</p>
          </Card>
        ))}
      </div>

      <AdminDataTable
        columns={[{ header: "Asset" }, { header: "Status" }, { header: "Owned URL" }, { header: "Error" }]}
        rows={assets.map((asset) => ({
          key: asset.id,
          cells: [
            <div key="asset" className="max-w-md space-y-1">
              <p className="truncate font-semibold text-[var(--text-primary)]">{asset.sourceUrl}</p>
              <p className="text-xs text-[var(--text-secondary)]">{asset.contentType ?? "unknown"} {asset.byteSize ? `/${asset.byteSize} bytes` : ""}</p>
            </div>,
            <AdminStatusBadge key="status" tone={statusTone(asset.status)}>{asset.status}</AdminStatusBadge>,
            asset.ownedUrl ? <a key="owned" href={asset.ownedUrl} className="text-sm underline" target="_blank" rel="noreferrer">Open owned image</a> : "-",
            <p key="error" className="max-w-sm text-sm text-[var(--text-secondary)]">{asset.error ?? "-"}</p>,
          ],
        }))}
        empty="No failed or Payhip-origin image assets recorded."
      />

      <AdminDataTable
        columns={[{ header: "Reference" }, { header: "Type" }, { header: "Source URL" }, { header: "Action" }]}
        rows={oldReferences.map((reference) => ({
          key: reference.key,
          cells: [
            <p key="title" className="font-semibold text-[var(--text-primary)]">{reference.title}</p>,
            reference.type,
            <p key="url" className="max-w-md truncate text-sm text-[var(--text-secondary)]">{reference.url}</p>,
            <Link key="action" href={reference.href} className={adminSecondaryButtonClass}>Edit</Link>,
          ],
        }))}
        empty="No Payhip image URLs are currently referenced by product records."
      />
    </AdminShell>
  );
}
