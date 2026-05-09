import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { HardLink } from "@/components/ui/hard-link";
import { AdminActionBar, AdminDataTable, AdminStatusBadge, adminButtonClass, adminSecondaryButtonClass } from "@/components/admin/admin-ui";
import { getPrimaryOffer } from "@/lib/offers/sync-product-offer";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";

export const dynamic = "force-dynamic";

function formatTypeLabel(type: string) {
  if (type === "COURSE_ACCESS") {
    return "Course";
  }

  if (type === "BUNDLE_ACCESS") {
    return "Bundle";
  }

  return type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

function getCheckoutReadiness(product: {
  status: string;
  offers: Array<{
    isDefault: boolean;
    isPublished: boolean;
    price: number | { toString(): string };
    prices: Array<{ amount: number | { toString(): string } }>;
  }>;
}) {
  const primaryOffer = getPrimaryOffer(product.offers);
  const amountValue = primaryOffer?.prices[0]?.amount ?? primaryOffer?.price ?? 0;
  const amount = Number(amountValue);

  if (product.status !== "PUBLISHED") {
    return { label: "Draft", tone: "muted" as const };
  }

  if (amount <= 0) {
    return { label: "Missing price", tone: "warning" as const };
  }

  if (primaryOffer?.isPublished) {
    return { label: "Ready", tone: "success" as const };
  }

  return { label: "Needs setup", tone: "warning" as const };
}

function getCheckoutStatusClass(tone: "muted" | "warning" | "success") {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-stone-200 bg-stone-50 text-stone-600";
}

export default async function AdminProductsPage() {
  const products = await prisma.accessProduct.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      course: {
        select: { id: true, title: true, slug: true, publicPath: true, legacyUrl: true },
      },
      bundle: {
        select: { id: true, title: true, slug: true, publicPath: true, legacyUrl: true },
      },
      grants: {
        select: { id: true },
        orderBy: { position: "asc" },
      },
      offers: {
        select: {
          isDefault: true,
          isPublished: true,
          price: true,
          prices: {
            select: { amount: true },
          },
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
          <HardLink href="/admin/courses/new" className={adminButtonClass}>
            Add course content
          </HardLink>
          <HardLink href="/admin/bundles/new" className={adminSecondaryButtonClass}>
            Add bundle content
          </HardLink>
        </div>
      </div>

      <AdminDataTable
        columns={[
          { header: "Type" },
          { header: "Title" },
          { header: "Unlocks" },
          { header: "Checkout" },
          { header: "Status" },
          { header: "Source" },
          { header: "Actions" },
        ]}
        rows={products.map((product) => {
          const checkoutReadiness = getCheckoutReadiness(product);
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

          return {
            key: product.id,
            cells: [
              <AdminStatusBadge key="type" tone="accent">{formatTypeLabel(product.type)}</AdminStatusBadge>,
              <span key="title" className="font-semibold text-[var(--text-primary)]">{product.course?.title ?? product.bundle?.title ?? product.title}</span>,
              product.bundle ? `${product.grants.length} courses` : "Course",
              <span key="checkout" className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getCheckoutStatusClass(checkoutReadiness.tone)}`}>
                {checkoutReadiness.label}
              </span>,
              <AdminStatusBadge key="status" tone={product.status === "PUBLISHED" ? "success" : product.status === "ARCHIVED" ? "neutral" : "warning"}>{product.status}</AdminStatusBadge>,
              product.course ? "Course" : product.bundle ? "Bundle" : "Standalone",
              <AdminActionBar key="actions">
                <HardLink href={`/admin/products/${product.id}`} className={adminSecondaryButtonClass}>
                  Manage
                </HardLink>
                <HardLink href={sourceHref} className={adminSecondaryButtonClass}>
                  Content
                </HardLink>
                {publicHref ? <HardLink href={publicHref} className={adminSecondaryButtonClass}>View</HardLink> : null}
              </AdminActionBar>,
            ],
          };
        })}
        empty="No products yet."
      />
    </AdminShell>
  );
}
