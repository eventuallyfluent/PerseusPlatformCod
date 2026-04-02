import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminBundlesPage() {
  const bundles = await prisma.bundle.findMany({
    include: {
      offers: {
        where: { isPublished: true },
        take: 1,
      },
      courses: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AdminShell title="Bundles" description="Course bundles sell one page and unlock multiple existing courses.">
      <div className="flex justify-end">
        <Link href="/admin/bundles/new" className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">
          New bundle
        </Link>
      </div>
      <Card className="overflow-hidden p-0">
        <table>
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th>Title</th>
              <th>Courses</th>
              <th>Status</th>
              <th>Price</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {bundles.map((bundle) => (
              <tr key={bundle.id}>
                <td>{bundle.title}</td>
                <td>{bundle.courses.length}</td>
                <td>{bundle.status}</td>
                <td>{bundle.offers[0]?.price?.toString() ?? "—"}</td>
                <td>{bundle.updatedAt.toLocaleDateString()}</td>
                <td>
                  <Link href={`/admin/bundles/${bundle.id}`} className="underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
