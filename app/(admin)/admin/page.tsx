import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [courses, bundles, orders, imports] = await Promise.all([
    prisma.course.count(),
    prisma.bundle.count(),
    prisma.order.count(),
    prisma.importBatch.count(),
  ]);

  return (
    <AdminShell title="Admin overview" description="Operational snapshot for Phase 1 modules.">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[["Courses", courses], ["Bundles", bundles], ["Orders", orders], ["Imports", imports]].map(([label, value]) => (
          <Card key={label} className="text-white">
            <p className="text-sm text-[#b8add7]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
          </Card>
        ))}
      </div>
      <Card className="space-y-3 text-white">
        <h2 className="text-lg font-semibold text-white">Build order status</h2>
        <ul className="space-y-2 text-sm text-[#c8bedf]">
          <li>1. Data model and seed services are in place.</li>
          <li>2. Course and bundle product flows are available alongside instructor, offer, and import admin screens.</li>
          <li>3. Public sales pages, checkout, dashboard, and learner views are connected.</li>
        </ul>
        <Link href="/admin/products" className="text-sm font-medium text-white underline">
          Add new product
        </Link>
      </Card>
    </AdminShell>
  );
}
