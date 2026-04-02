import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = await prisma.user.findMany({
    include: {
      enrollments: {
        include: {
          course: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell title="Students" description="Single-tenant student list with enrollment visibility.">
      <div className="grid gap-4">
        {students.map((student) => (
          <Card key={student.id} className="space-y-3">
            <h2 className="text-lg font-semibold text-stone-950">{student.email}</h2>
            <ul className="space-y-2 text-sm text-stone-600">
              {student.enrollments.map((enrollment) => (
                <li key={enrollment.id}>{enrollment.course.title}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
