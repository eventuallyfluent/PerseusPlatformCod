import { AdminShell } from "@/components/admin/admin-shell";
import { AdminActionBar, AdminDataTable, AdminStat, AdminStatusBadge, adminButtonClass, adminSecondaryButtonClass } from "@/components/admin/admin-ui";
import { HardLink } from "@/components/ui/hard-link";
import { formatAdminMoney, getAdminDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const data = await getAdminDashboardData();

  return (
    <AdminShell title="Admin overview" description="Sales, students, payments, reviews, and recent activity.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat label="Revenue this month" value={formatAdminMoney(data.revenueThisMonth)} detail={`${data.monthlyOrders} paid order${data.monthlyOrders === 1 ? "" : "s"}`} />
        <AdminStat label="Students" value={data.totalStudents} detail={`${data.newStudents} new this month`} />
        <AdminStat label="Enrollments" value={data.newEnrollments} detail="New course enrollments this month" />
        <AdminStat
          label="Needs action"
          value={data.manualPaymentOrders + data.pendingReviews}
          detail={`${data.manualPaymentOrders} payment queue, ${data.pendingReviews} reviews`}
          tone={data.manualPaymentOrders + data.pendingReviews > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.48fr)]">
        <section className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent orders</h2>
              <p className="text-sm text-[var(--text-secondary)]">Latest checkout activity across all products.</p>
            </div>
            <AdminActionBar>
              <HardLink href="/admin/orders" className={adminSecondaryButtonClass}>
                View orders
              </HardLink>
              <HardLink href="/admin/courses/new" className={adminButtonClass}>
                New course
              </HardLink>
            </AdminActionBar>
          </div>
          <AdminDataTable
            columns={[
              { header: "Order" },
              { header: "Customer" },
              { header: "Product" },
              { header: "Status" },
              { header: "Total" },
              { header: "Created" },
            ]}
            rows={data.recentOrders.map((order) => ({
              key: order.id,
              cells: [
                <span key="id" className="font-semibold text-[var(--text-primary)]">{order.id.slice(0, 8)}</span>,
                order.user?.email ?? "Guest",
                order.offer.course?.title ?? order.offer.bundle?.title ?? order.offer.name,
                <AdminStatusBadge key="status" tone={order.status === "PAID" ? "success" : order.status === "FAILED" ? "danger" : "warning"}>{order.status.replaceAll("_", " ")}</AdminStatusBadge>,
                formatAdminMoney(Number(order.totalAmount), order.currency),
                order.createdAt.toLocaleDateString(),
              ],
            }))}
            empty="No orders yet."
          />
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent content</h2>
            <p className="text-sm text-[var(--text-secondary)]">Recently edited courses and bundles.</p>
          </div>
          <div className="grid gap-3">
            {data.latestContent.map((product) => (
              <div key={`${product.type}-${product.id}`} className="rounded-lg border border-[var(--border)] bg-[var(--surface-panel)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <AdminStatusBadge tone="accent">{product.type}</AdminStatusBadge>
                      <AdminStatusBadge tone={product.status === "PUBLISHED" ? "success" : product.status === "ARCHIVED" ? "neutral" : "warning"}>{product.status}</AdminStatusBadge>
                    </div>
                    <h3 className="truncate text-base font-semibold text-[var(--text-primary)]">{product.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{formatAdminMoney(Number(product.price), product.currency)}</p>
                  </div>
                  <AdminActionBar>
                    <HardLink href={product.viewHref} className={adminSecondaryButtonClass}>
                      View
                    </HardLink>
                    <HardLink href={product.editHref} className={adminButtonClass}>
                      Edit
                    </HardLink>
                  </AdminActionBar>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
