import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    include: {
      instructor: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AdminShell title="Courses" description="Create, edit, publish, and manage course pricing from one product screen.">
      <div className="flex justify-end">
        <Link href="/admin/courses/new" className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">
          Add new product
        </Link>
      </div>
      <Card className="overflow-hidden p-0">
        <table>
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th>Title</th>
              <th>Instructor</th>
              <th>Status</th>
              <th>Price</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.title}</td>
                <td>{course.instructor.name}</td>
                <td>{course.status}</td>
                <td>{course.price.toString()} {course.currency}</td>
                <td>{course.updatedAt.toLocaleDateString()}</td>
                <td>
                  <Link href={`/admin/courses/${course.id}`} className="underline">
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
