import { AdminShell } from "@/components/admin/admin-shell";
import { NewBundleForm } from "@/components/admin/new-bundle-form";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function NewBundlePage() {
  const uploadEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const allCourses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      subtitle: true,
    },
  });
  return (
    <AdminShell title="New bundle" description="A bundle sells multiple existing courses through one public page and checkout flow.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_320px]">
        <Card className="space-y-8 p-8">
          <div className="space-y-4 border-b border-[var(--border)] pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Bundle setup</p>
            <div className="space-y-3">
              <h2 className="text-4xl leading-none tracking-[-0.04em] text-stone-950">Create one sales container for multiple courses.</h2>
              <p className="max-w-3xl text-sm leading-7 text-stone-700">
                Create the bundle shell, choose the included courses, and set the live price in one first pass so the public page is meaningful immediately.
              </p>
            </div>
          </div>
          <NewBundleForm courses={allCourses} uploadEnabled={uploadEnabled} />
        </Card>

        <div className="space-y-4">
            <Card className="space-y-4 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">What happens next</p>
              <ul className="space-y-2 text-sm leading-7 text-stone-600">
                <li>The bundle gets its own public path and generated sales page payload.</li>
                <li>You can choose the included courses now and refine them later on the bundle detail screen.</li>
                <li>Purchases unlock each linked course as a normal enrollment.</li>
              </ul>
            </Card>
            <Card className="space-y-4 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Bundle guidance</p>
              <ul className="space-y-2 text-sm leading-7 text-stone-600">
                <li>Keep the promise focused on convenience and coherent scope.</li>
                <li>Use `legacyUrl` only when preserving an existing migrated bundle path.</li>
                <li>Course selection, offer setup, and social proof happen after this first save.</li>
              </ul>
            </Card>
        </div>
      </div>
    </AdminShell>
  );
}
