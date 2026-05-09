import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { HardLink } from "@/components/ui/hard-link";
import { AdminActionBar, AdminDataTable, adminButtonClass, adminSecondaryButtonClass } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const collections = await prisma.collection.findMany({
    select: {
      id: true,
      position: true,
      title: true,
      slug: true,
      updatedAt: true,
      courses: {
        select: { id: true },
      },
    },
    orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
  });

  return (
    <AdminShell
      title="Collections"
      description="Create collections, give each one its image and description, then assign the courses that belong in it."
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-stone-600">
          {collections.length} collection{collections.length === 1 ? "" : "s"}
        </div>
        <HardLink href="/admin/collections/new" className={adminButtonClass}>
          Add collection
        </HardLink>
      </div>

      <AdminDataTable
        columns={[{ header: "Position" }, { header: "Title" }, { header: "Slug" }, { header: "Courses" }, { header: "Updated" }, { header: "Actions" }]}
        rows={collections.map((collection) => ({
          key: collection.id,
          cells: [
            collection.position,
            <span key="title" className="font-semibold text-[var(--text-primary)]">{collection.title}</span>,
            collection.slug,
            collection.courses.length,
            collection.updatedAt.toLocaleDateString(),
            <AdminActionBar key="actions">
              <HardLink href={`/courses?collection=${encodeURIComponent(collection.slug)}`} className={adminSecondaryButtonClass}>
                View
              </HardLink>
              <HardLink href={`/admin/collections/${collection.id}`} className={adminSecondaryButtonClass}>
                Edit
              </HardLink>
            </AdminActionBar>,
          ],
        }))}
        empty="No collections yet."
      />
    </AdminShell>
  );
}
