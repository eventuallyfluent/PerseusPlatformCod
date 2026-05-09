import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { HardLink } from "@/components/ui/hard-link";
import { AdminActionBar, AdminDataTable, AdminStatusBadge, adminButtonClass, adminSecondaryButtonClass } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminBundlesPage() {
  const bundles = await prisma.bundle.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      price: true,
      currency: true,
      updatedAt: true,
      courses: {
        select: { id: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AdminShell title="Bundles" description="Bundle pricing now lives directly on the bundle product.">
      <div className="flex justify-end">
        <HardLink href="/admin/bundles/new" className={adminButtonClass}>
          New bundle
        </HardLink>
      </div>
      <AdminDataTable
        columns={[{ header: "Title" }, { header: "Courses" }, { header: "Status" }, { header: "Price" }, { header: "Updated" }, { header: "Actions" }]}
        rows={bundles.map((bundle) => ({
          key: bundle.id,
          cells: [
            <span key="title" className="font-semibold text-[var(--text-primary)]">{bundle.title}</span>,
            bundle.courses.length,
            <AdminStatusBadge key="status" tone={bundle.status === "PUBLISHED" ? "success" : bundle.status === "ARCHIVED" ? "neutral" : "warning"}>{bundle.status}</AdminStatusBadge>,
            `${bundle.price.toString()} ${bundle.currency}`,
            bundle.updatedAt.toLocaleDateString(),
            <AdminActionBar key="actions">
              <HardLink href={`/admin/bundles/${bundle.id}`} className={adminSecondaryButtonClass}>
                Edit
              </HardLink>
            </AdminActionBar>,
          ],
        }))}
        empty="No bundles yet."
      />
    </AdminShell>
  );
}
