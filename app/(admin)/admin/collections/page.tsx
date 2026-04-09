import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { HardLink } from "@/components/ui/hard-link";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const collections = await prisma.collection.findMany({
    include: {
      courses: true,
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
        <HardLink href="/admin/collections/new" className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">
          Add collection
        </HardLink>
      </div>

      <Card className="overflow-hidden p-0">
        <table>
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th>Position</th>
              <th>Title</th>
              <th>Slug</th>
              <th>Courses</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {collections.map((collection) => (
              <tr key={collection.id}>
                <td>{collection.position}</td>
                <td>{collection.title}</td>
                <td>{collection.slug}</td>
                <td>{collection.courses.length}</td>
                <td>{collection.updatedAt.toLocaleDateString()}</td>
                <td className="space-x-3">
                  <HardLink href={`/courses?collection=${encodeURIComponent(collection.slug)}`} className="underline">
                    View in store
                  </HardLink>
                  <HardLink href={`/admin/collections/${collection.id}`} className="underline">
                    Edit
                  </HardLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
