import { AdminShell } from "@/components/admin/admin-shell";
import { AdminActionBar, AdminDataTable, AdminStat, AdminStatusBadge, adminSecondaryButtonClass } from "@/components/admin/admin-ui";
import { HardLink } from "@/components/ui/hard-link";
import { formatAdminMoney } from "@/lib/admin/dashboard";
import { getAdminReportData } from "@/lib/admin/reports";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const data = await getAdminReportData(query);
  const queryString = new URLSearchParams({
    preset: query.preset ?? "this-month",
    ...(query.from ? { from: query.from } : {}),
    ...(query.to ? { to: query.to } : {}),
  }).toString();

  return (
    <AdminShell title="Reports" description="Sales, tax, subscriptions, and enrollment reporting by month, quarter, year, or custom range.">
      <div className="grid gap-5">
        <form className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-panel)] p-4 md:grid-cols-[220px_1fr_1fr_auto]">
          <select name="preset" defaultValue={query.preset ?? "this-month" as string} className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm">
            <option value="this-month">This month</option>
            <option value="last-month">Last month</option>
            <option value="this-quarter">This quarter</option>
            <option value="last-quarter">Last quarter</option>
            <option value="year-to-date">Year to date</option>
            <option value="last-year">Last year</option>
            <option value="custom">Custom</option>
          </select>
          <input name="from" type="date" defaultValue={query.from ?? ""} className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm" />
          <input name="to" type="date" defaultValue={query.to ?? ""} className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm" />
          <button className="rounded-lg bg-stone-950 px-4 py-3 text-sm font-semibold text-stone-50" type="submit">Apply</button>
        </form>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStat label="Gross sales" value={formatAdminMoney(data.summary.grossSales)} detail={`${data.summary.orderCount} paid orders`} />
          <AdminStat label="Net revenue" value={formatAdminMoney(data.summary.netRevenue)} detail={`AOV ${formatAdminMoney(data.summary.averageOrderValue)}`} />
          <AdminStat label="Tax collected" value={formatAdminMoney(data.summary.taxCollected)} detail={`${data.taxByJurisdiction.length} jurisdictions`} />
          <AdminStat label="Subscriptions" value={data.summary.activeSubscriptions} detail={`${data.summary.newSubscriptions} new, ${data.summary.cancelledSubscriptions} cancelled`} />
          <AdminStat label="Discounts" value={formatAdminMoney(data.summary.discounts)} />
          <AdminStat label="Refunds" value={formatAdminMoney(data.summary.refunds)} tone={data.summary.refunds > 0 ? "warning" : "neutral"} />
          <AdminStat label="Enrollments" value={data.summary.enrollmentsCreated} detail="Created in range" />
        </div>

        <AdminActionBar>
          <HardLink href={`/admin/reports/export/sales?${queryString}`} className={adminSecondaryButtonClass}>Export sales CSV</HardLink>
          <HardLink href={`/admin/reports/export/taxes?${queryString}`} className={adminSecondaryButtonClass}>Export tax CSV</HardLink>
        </AdminActionBar>

        <AdminDataTable
          columns={[{ header: "Order" }, { header: "Customer" }, { header: "Product" }, { header: "Status" }, { header: "Tax" }, { header: "Total" }, { header: "Date" }]}
          rows={data.orders.map((order) => ({
            key: order.id,
            cells: [
              order.id.slice(0, 8),
              order.user?.email ?? "Guest",
              order.offer.course?.title ?? order.offer.bundle?.title ?? order.offer.accessProduct?.title ?? order.offer.name,
              <AdminStatusBadge key="status" tone={order.status === "PAID" ? "success" : order.status === "REFUNDED" ? "warning" : "neutral"}>{order.status}</AdminStatusBadge>,
              formatAdminMoney(Number(order.taxAmount), order.currency),
              formatAdminMoney(Number(order.totalAmount), order.currency),
              order.createdAt.toLocaleDateString(),
            ],
          }))}
          empty="No orders in this range."
        />

        <div className="grid gap-5 xl:grid-cols-3">
          <AdminDataTable
            columns={[{ header: "Product" }, { header: "Orders" }, { header: "Revenue" }]}
            rows={data.productRevenue.map((item) => ({ key: item.label, cells: [item.label, item.orders, formatAdminMoney(item.amount)] }))}
            empty="No product revenue in this range."
          />
          <AdminDataTable
            columns={[{ header: "Jurisdiction" }, { header: "Tax" }]}
            rows={data.taxByJurisdiction.map((item) => ({ key: item.label, cells: [item.label, formatAdminMoney(item.amount)] }))}
            empty="No tax collected in this range."
          />
          <AdminDataTable
            columns={[{ header: "Gateway" }, { header: "Orders" }, { header: "Total" }]}
            rows={data.gatewayTotals.map((item) => ({ key: item.label, cells: [item.label, item.orders, formatAdminMoney(item.amount)] }))}
            empty="No gateway totals in this range."
          />
        </div>
      </div>
    </AdminShell>
  );
}
