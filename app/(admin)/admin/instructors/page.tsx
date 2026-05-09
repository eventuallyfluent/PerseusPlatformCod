import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { HardLink } from "@/components/ui/hard-link";
import { AdminActionBar, AdminDataTable, adminButtonClass, adminSecondaryButtonClass } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default async function InstructorsPage() {
  const instructors = await prisma.instructor.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AdminShell title="Instructors" description="Manage instructor bios, social links, and public profile pages.">
      <div className="flex justify-end">
        <HardLink href="/admin/instructors/new" className={adminButtonClass}>
          New instructor
        </HardLink>
      </div>
      <AdminDataTable
        columns={[{ header: "Name" }, { header: "Slug" }, { header: "Updated" }, { header: "Actions" }]}
        rows={instructors.map((instructor) => ({
          key: instructor.id,
          cells: [
            <span key="name" className="font-semibold text-[var(--text-primary)]">{instructor.name}</span>,
            instructor.slug,
            instructor.updatedAt.toLocaleDateString(),
            <AdminActionBar key="actions">
              <HardLink href={`/admin/instructors/${instructor.id}`} className={adminSecondaryButtonClass}>
                Edit
              </HardLink>
            </AdminActionBar>,
          ],
        }))}
        empty="No instructors yet."
      />
    </AdminShell>
  );
}
