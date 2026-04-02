import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function InstructorsPage() {
  const instructors = await prisma.instructor.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AdminShell title="Instructors" description="Manage instructor bios, social links, and public profile pages.">
      <div className="flex justify-end">
        <Link href="/admin/instructors/new" className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">
          New instructor
        </Link>
      </div>
      <Card className="overflow-hidden p-0">
        <table>
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {instructors.map((instructor) => (
              <tr key={instructor.id}>
                <td>{instructor.name}</td>
                <td>{instructor.slug}</td>
                <td>{instructor.updatedAt.toLocaleDateString()}</td>
                <td>
                  <Link href={`/admin/instructors/${instructor.id}`} className="underline">
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
