import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { HardLink } from "@/components/ui/hard-link";
import { getPrimaryOffer } from "@/lib/offers/sync-product-offer";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";

export const dynamic = "force-dynamic";

function formatTypeLabel(type: string) {
  return type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

export default async function AdminProductsPage() {
  const products = await prisma.accessProduct.findMany({
    include: {
      course: true,
      bundle: {
        include: {
          courses: true,
        },
      },
      grants: {
        include: {
          course: {
            include: {
              instructor: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
      offers: {
        include: {
          prices: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AdminShell title="Products" description="Products are the sellable layer. They control checkout, pricing, thank-you flow, and what content a buyer unlocks.">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3 text-sm text-stone-600">
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-panel-strong)] px-4 py-2">
            {products.length} product{products.length === 1 ? "" : "s"}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-panel-strong)] px-4 py-2">
            {products.reduce((count, product) => count + product.grants.length, 0)} unlocked course{products.reduce((count, product) => count + product.grants.length, 0) === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <HardLink href="/admin/courses/new" className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">
            Add course content
          </HardLink>
          <HardLink href="/admin/bundles/new" className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-medium text-stone-800">
            Add bundle content
          </HardLink>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <table>
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th>Type</th>
              <th>Title</th>
              <th>Unlocks</th>
              <th>Checkout</th>
              <th>Status</th>
              <th>Content Source</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const primaryOffer = getPrimaryOffer(product.offers);
              const sourceHref = product.course
                ? `/admin/courses/${product.course.id}`
                : product.bundle
                  ? `/admin/bundles/${product.bundle.id}`
                  : `/admin/products/${product.id}`;
              const publicHref = product.course
                ? resolveCoursePublicPath(product.course)
                : product.bundle
                  ? resolveBundlePublicPath(product.bundle)
                  : null;

              return (
                <tr key={product.id}>
                  <td>
                    <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                      {formatTypeLabel(product.type)}
                    </span>
                  </td>
                  <td>{product.title}</td>
                  <td>{product.grants.length} course{product.grants.length === 1 ? "" : "s"}</td>
                  <td>{primaryOffer ? `/checkout/${primaryOffer.id}` : "No published offer"}</td>
                  <td>{product.status}</td>
                  <td>{product.course ? "Course" : product.bundle ? "Bundle" : "Standalone"}</td>
                  <td className="space-x-3">
                    <HardLink href={`/admin/products/${product.id}`} className="underline">
                      Manage product
                    </HardLink>
                    <HardLink href={sourceHref} className="underline">
                      Content
                    </HardLink>
                    {publicHref ? (
                      <HardLink href={publicHref} className="underline">
                        View
                      </HardLink>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
