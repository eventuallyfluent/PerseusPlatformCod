import { requireAdmin } from "@/lib/auth/guards";
import { getAdminReportData } from "@/lib/admin/reports";

export const dynamic = "force-dynamic";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET(request: Request) {
  await requireAdmin();

  const url = new URL(request.url);
  const data = await getAdminReportData({
    preset: url.searchParams.get("preset") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });
  const rows = [
    ["order_id", "customer", "product", "status", "subtotal", "discount", "tax", "total", "currency", "created_at"],
    ...data.orders.map((order) => [
      order.id,
      order.user?.email ?? "Guest",
      order.offer.course?.title ?? order.offer.bundle?.title ?? order.offer.accessProduct?.title ?? order.offer.name,
      order.status,
      order.subtotalAmount,
      order.discountAmount,
      order.taxAmount,
      order.totalAmount,
      order.currency,
      order.createdAt.toISOString(),
    ]),
  ];
  const body = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=perseus-sales-report.csv",
    },
  });
}
