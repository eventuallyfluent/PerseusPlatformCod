import { AdminShell } from "@/components/admin/admin-shell";
import { AdminActionBar, AdminDataTable, AdminStat, AdminStatusBadge, adminButtonClass, adminSecondaryButtonClass } from "@/components/admin/admin-ui";
import { HardLink } from "@/components/ui/hard-link";
import { formatAdminMoney, getAdminDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const data = await getAdminDashboardData();
  const metrics = data.metrics.status === "available" ? data.metrics.data : null;
  const metricsDetail = data.metrics.status === "available" && data.metrics.stale ? "Showing last available dashboard snapshot" : undefined;
  const recentOrders = data.recentOrders.status === "available" ? data.recentOrders.data : [];
  const reviewsNeedingCheck = data.reviewsNeedingCheck.status === "available" ? data.reviewsNeedingCheck.data : [];
  const recentInquiries = data.recentInquiries.status === "available" ? data.recentInquiries.data : [];
  const unreadInquiries = metrics?.unreadInquiries ?? null;

  return (
    <AdminShell title="Admin overview" description="Month-to-date earnings, recent sales, inquiries, and reviews needing approval.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStat
          label="Month-to-date earnings"
          value={metrics ? formatAdminMoney(metrics.revenueThisMonth) : "Unavailable"}
          detail={metrics ? `${metrics.monthlyOrders} paid sale${metrics.monthlyOrders === 1 ? "" : "s"} this month${metricsDetail ? ` - ${metricsDetail}` : ""}` : "Dashboard metrics could not be loaded."}
          tone={metrics ? "neutral" : "warning"}
        />
        <AdminStat label="Students" value={metrics?.totalStudents ?? "Unavailable"} detail={metrics ? `${metrics.newStudents} new this month` : "Student count could not be loaded."} tone={metrics ? "neutral" : "warning"} />
        <AdminStat label="Enrollments" value={metrics?.newEnrollments ?? "Unavailable"} detail={metrics ? "New course enrollments this month" : "Enrollment count could not be loaded."} tone={metrics ? "neutral" : "warning"} />
        <AdminStat
          label="Unread inquiries"
          value={unreadInquiries ?? "Unavailable"}
          detail={unreadInquiries !== null ? "Course questions from sales pages" : "Inquiry count could not be loaded."}
          href="/admin/inquiries"
          tone={unreadInquiries === null ? "warning" : unreadInquiries > 0 ? "warning" : "success"}
        />
        <AdminStat
          label="Reviews to check"
          value={metrics?.pendingReviews ?? "Unavailable"}
          detail={metrics ? (metrics.manualPaymentOrders > 0 ? `${metrics.manualPaymentOrders} payment order${metrics.manualPaymentOrders === 1 ? "" : "s"} also waiting` : "New reviews needing approval") : "Review count could not be loaded."}
          tone={metrics && metrics.manualPaymentOrders + metrics.pendingReviews > 0 ? "warning" : metrics ? "success" : "warning"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.48fr)]">
        <section className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent sales</h2>
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
            rows={recentOrders.map((order) => ({
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
            empty={data.recentOrders.status === "available" ? "No sales yet." : "Recent sales are temporarily unavailable. The rest of the admin overview is still usable."}
          />
        </section>

        <section className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Reviews needing check</h2>
              <p className="text-sm text-[var(--text-secondary)]">New student reviews waiting for approval.</p>
            </div>
            <HardLink href="/admin/reviews" className={adminSecondaryButtonClass}>
              View reviews
            </HardLink>
          </div>
          <div className="grid gap-3">
            {data.reviewsNeedingCheck.status === "unavailable" ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Reviews are temporarily unavailable. Use the review queue link to retry that section.
              </div>
            ) : reviewsNeedingCheck.length > 0 ? (
              reviewsNeedingCheck.map((review) => (
              <div key={review.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-panel)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <AdminStatusBadge tone="warning">Needs check</AdminStatusBadge>
                      <AdminStatusBadge tone={review.recommendsProduct ? "success" : "neutral"}>{review.rating}/5 stars</AdminStatusBadge>
                    </div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">{review.name || "Anonymous student"}</h3>
                    <p className="line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">{review.quote}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      {review.course?.title ?? review.bundle?.title ?? "General review"}
                    </p>
                  </div>
                  <AdminActionBar>
                    <HardLink href="/admin/reviews" className={adminButtonClass}>
                      Check
                    </HardLink>
                  </AdminActionBar>
                </div>
              </div>
              ))
            ) : (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-panel)] p-4 text-sm text-[var(--text-secondary)]">
                No reviews waiting for approval.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Unread inquiries</h2>
            <p className="text-sm text-[var(--text-secondary)]">Course questions that still need a response.</p>
          </div>
          <HardLink href="/admin/inquiries" className={adminSecondaryButtonClass}>
            View inquiries
          </HardLink>
        </div>
        <AdminDataTable
          columns={[
            { header: "Sender" },
            { header: "Course" },
            { header: "Status" },
            { header: "Message" },
            { header: "Created" },
          ]}
          rows={recentInquiries.map((inquiry) => ({
            key: inquiry.id,
            cells: [
              <span key="sender" className="font-semibold text-[var(--text-primary)]">
                {inquiry.name}
                <br />
                <span className="font-normal text-[var(--text-secondary)]">{inquiry.email}</span>
              </span>,
              inquiry.course?.title ?? "General course question",
              <AdminStatusBadge key="status" tone={inquiry.status === "UNREAD" ? "warning" : "neutral"}>{inquiry.status.toLowerCase()}</AdminStatusBadge>,
              <span key="message" className="line-clamp-2">{inquiry.message}</span>,
              inquiry.createdAt.toLocaleDateString(),
            ],
          }))}
          empty={data.recentInquiries.status === "available" ? "No unread course inquiries." : "Unread inquiries are temporarily unavailable. The full inbox can still be opened from this page."}
        />
      </section>
    </AdminShell>
  );
}
