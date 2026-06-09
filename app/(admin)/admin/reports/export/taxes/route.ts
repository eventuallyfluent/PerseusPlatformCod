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
    ["jurisdiction", "tax_collected"],
    ...data.taxByJurisdiction.map((item) => [item.label, item.amount]),
  ];
  const body = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=perseus-tax-report.csv",
    },
  });
}
