import { AdminShell } from "@/components/admin/admin-shell";
import { AdminActionBar, AdminDataTable, AdminStat, AdminStatusBadge, adminButtonClass, adminSecondaryButtonClass } from "@/components/admin/admin-ui";
import { HardLink } from "@/components/ui/hard-link";
import { formatAdminMoney, getAdminDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const data = await getAdminDashboardData();

  return (
    <AdminShell title="Admin overview" description="Month-to-date earnings, recent sales, inquiries, and reviews needing approval.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStat label="Month-to-date earnings" value={formatAdminMoney(data.revenueThisMonth)} detail={`${data.monthlyOrders} paid sale${data.monthlyOrders === 1 ? "" : "s"} this month`} />
        <AdminStat label="Students" value={data.totalStudents} detail={`${data.newStudents} new this month`} />
        <AdminStat label="Enrollments" value={data.newEnrollments} detail="New course enrollments this month" />
        <AdminStat label="Unread inquiries" value={data.unreadInquiries} detail="Course questions from sales pages" href="/admin/inquiries" tone={data.unreadInquiries > 0 ? "warning" : "success"} />
        <AdminStat
          label="Reviews to check"
          value={data.pendingReviews}
          detail={data.manualPaymentOrders > 0 ? `${data.manualPaymentOrders} payment order${data.manualPaymentOrders === 1 ? "" : "s"} also waiting` : "New reviews needing approval"}
          tone={data.manualPaymentOrders + data.pendingReviews > 0 ? "warning" : "success"}
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
            empty="No sales yet."
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
            {data.reviewsNeedingCheck.length > 0 ? (
              data.reviewsNeedingCheck.map((review) => (
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
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent inquiries</h2>
            <p className="text-sm text-[var(--text-secondary)]">Course questions submitted from sales pages.</p>
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
          rows={data.recentInquiries.map((inquiry) => ({
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
          empty="No course inquiries yet."
        />
      </section>
    </AdminShell>
  );
}
