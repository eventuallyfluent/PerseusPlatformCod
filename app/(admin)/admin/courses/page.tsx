import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { HardLink } from "@/components/ui/hard-link";
import { AdminActionBar, AdminDataTable, AdminStatusBadge, adminButtonClass, adminSecondaryButtonClass } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      price: true,
      currency: true,
      updatedAt: true,
      instructor: {
        select: { name: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AdminShell title="Courses" description="Create, edit, publish, and manage course pricing from one product screen.">
      <div className="flex justify-end">
        <HardLink href="/admin/courses/new" className={adminButtonClass}>
          Add new product
        </HardLink>
      </div>
      <AdminDataTable
        columns={[{ header: "Title" }, { header: "Instructor" }, { header: "Status" }, { header: "Price" }, { header: "Updated" }, { header: "Actions" }]}
        rows={courses.map((course) => ({
          key: course.id,
          cells: [
            <span key="title" className="font-semibold text-[var(--text-primary)]">{course.title}</span>,
            course.instructor.name,
            <AdminStatusBadge key="status" tone={course.status === "PUBLISHED" ? "success" : course.status === "ARCHIVED" ? "neutral" : "warning"}>{course.status}</AdminStatusBadge>,
            `${course.price.toString()} ${course.currency}`,
            course.updatedAt.toLocaleDateString(),
            <AdminActionBar key="actions">
              <HardLink href={`/admin/courses/${course.id}`} className={adminSecondaryButtonClass}>
                Edit
              </HardLink>
            </AdminActionBar>,
          ],
        }))}
        empty="No courses yet."
      />
    </AdminShell>
  );
}
