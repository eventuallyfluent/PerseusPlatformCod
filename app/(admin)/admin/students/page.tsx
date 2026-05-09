import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminDataTable } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      enrollments: {
        select: {
          id: true,
          course: {
            select: { title: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell title="Students" description="Single-tenant student list with enrollment visibility.">
      <AdminDataTable
        columns={[{ header: "Student" }, { header: "Name" }, { header: "Enrollments" }, { header: "Joined" }]}
        rows={students.map((student) => ({
          key: student.id,
          cells: [
            <span key="email" className="font-semibold text-[var(--text-primary)]">{student.email}</span>,
            student.name ?? "-",
            student.enrollments.length > 0 ? student.enrollments.map((enrollment) => enrollment.course.title).join(", ") : "No enrollments",
            student.createdAt.toLocaleDateString(),
          ],
        }))}
        empty="No students yet."
      />
    </AdminShell>
  );
}
