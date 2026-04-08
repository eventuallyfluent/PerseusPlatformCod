import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { deleteInstructorAction, saveInstructorAction } from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

export default async function InstructorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const instructor = await prisma.instructor.findUnique({
    where: { id },
    include: { courses: true },
  });

  if (!instructor) {
    notFound();
  }

  return (
    <AdminShell title={instructor.name} description="Edit public instructor details and linked course list.">
      <Card>
        <form action={saveInstructorAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={instructor.id} />
          <label>
            Name
            <input name="name" defaultValue={instructor.name} required />
          </label>
          <label>
            Slug
            <input name="slug" defaultValue={instructor.slug} required />
          </label>
          <label>
            Image URL
            <input name="imageUrl" defaultValue={instructor.imageUrl ?? ""} />
          </label>
          <label>
            Website URL
            <input name="websiteUrl" defaultValue={instructor.websiteUrl ?? ""} />
          </label>
          <label className="md:col-span-2">
            Short bio
            <textarea name="shortBio" rows={3} defaultValue={instructor.shortBio ?? ""} />
          </label>
          <label className="md:col-span-2">
            Long bio
            <textarea name="longBio" rows={6} defaultValue={instructor.longBio ?? ""} />
          </label>
          <label>
            YouTube URL
            <input name="youtubeUrl" defaultValue={instructor.youtubeUrl ?? ""} />
          </label>
          <label>
            Instagram URL
            <input name="instagramUrl" defaultValue={instructor.instagramUrl ?? ""} />
          </label>
          <label>
            X URL
            <input name="xUrl" defaultValue={instructor.xUrl ?? ""} />
          </label>
          <label>
            Facebook URL
            <input name="facebookUrl" defaultValue={instructor.facebookUrl ?? ""} />
          </label>
          <label>
            Discord URL
            <input name="discordUrl" defaultValue={instructor.discordUrl ?? ""} />
          </label>
          <label>
            Telegram URL
            <input name="telegramUrl" defaultValue={instructor.telegramUrl ?? ""} />
          </label>
          <div className="md:col-span-2 rounded-[24px] border border-stone-200 bg-stone-50 p-4">
            <p className="mb-3 text-sm font-medium text-stone-900">Current image preview</p>
            <div
              className="h-56 rounded-[20px] border border-stone-200 bg-stone-100 bg-cover bg-center"
              style={{
                backgroundImage: instructor.imageUrl
                  ? `linear-gradient(180deg, rgba(28,25,23,0.12), rgba(28,25,23,0.42)), url(${instructor.imageUrl})`
                  : "linear-gradient(135deg, #f5f5f4, #e7e5e4)",
              }}
            />
          </div>
          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-3">
              <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">Save instructor</button>
              <button
                className="rounded-full border border-rose-200 px-5 py-3 text-sm font-medium text-rose-700"
                type="submit"
                formAction={deleteInstructorAction}
                name="instructorId"
                value={instructor.id}
              >
                Delete instructor
              </button>
            </div>
          </div>
        </form>
      </Card>
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-950">Course list</h2>
        <ul className="space-y-2 text-sm text-stone-600">
          {instructor.courses.map((course) => (
            <li key={course.id}>{course.title}</li>
          ))}
        </ul>
      </Card>
    </AdminShell>
  );
}
