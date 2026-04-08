import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { deleteCollectionAction, saveCollectionAction, saveCollectionCoursesAction } from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [collection, courses] = await Promise.all([
    prisma.collection.findUnique({
      where: { id },
      include: {
        courses: {
          orderBy: { position: "asc" },
        },
      },
    }),
    prisma.course.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, slug: true, status: true },
    }),
  ]);

  if (!collection) {
    notFound();
  }

  const selectedCourseIds = new Set(collection.courses.map((item) => item.courseId));

  return (
    <AdminShell
      title={collection.title}
      description="Edit the collection page details here, then assign the courses that belong inside this collection."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <Card className="space-y-8 bg-white p-8">
          <form id="collection-details-form" action={saveCollectionAction} className="space-y-8">
            <input type="hidden" name="id" value={collection.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                Eyebrow
                <input name="eyebrow" defaultValue={collection.eyebrow ?? ""} />
              </label>
              <label>
                Position
                <input name="position" type="number" min="1" defaultValue={collection.position} />
              </label>
              <label>
                Title
                <input name="title" defaultValue={collection.title} required />
              </label>
              <label>
                Slug
                <input name="slug" defaultValue={collection.slug} required />
              </label>
              <label>
                Tone
                <select name="tone" defaultValue={collection.tone}>
                  <option value="arcane">Arcane</option>
                  <option value="discipline">Discipline</option>
                  <option value="gateway">Gateway</option>
                </select>
              </label>
              <label>
                Image URL
                <input name="imageUrl" defaultValue={collection.imageUrl ?? ""} />
              </label>
            </div>
            <label className="block">
              Description
              <textarea name="description" rows={5} defaultValue={collection.description} required />
            </label>
            <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4">
              <p className="mb-3 text-sm font-medium text-stone-900">Current collection image</p>
              <div
                className="h-56 rounded-[20px] border border-stone-200 bg-stone-100 bg-cover bg-center"
                style={{
                  backgroundImage: collection.imageUrl
                    ? `linear-gradient(180deg, rgba(28,25,23,0.12), rgba(28,25,23,0.42)), url(${collection.imageUrl})`
                    : "linear-gradient(135deg, #f5f5f4, #e7e5e4)",
                }}
              />
            </div>
            <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" type="submit">
              Save collection
            </button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Actions</p>
            <div className="grid gap-3">
              <button
                className="w-full rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50"
                type="submit"
                form="collection-details-form"
              >
                Save collection changes
              </button>
              <Link href={`/collections/${collection.slug}`} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">
                View collection page
              </Link>
              <form action={deleteCollectionAction}>
                <input type="hidden" name="collectionId" value={collection.id} />
                <button className="w-full rounded-full border border-rose-200 px-5 py-3 text-sm font-medium text-rose-700" type="submit">
                  Delete collection
                </button>
              </form>
            </div>
          </Card>
        </div>
      </div>

      <Card className="space-y-4 bg-white">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-stone-950">Courses in this collection</h2>
          <p className="text-sm text-stone-600">Choose any courses you want grouped inside this collection.</p>
        </div>
        <form action={saveCollectionCoursesAction} className="space-y-3">
          <input type="hidden" name="collectionId" value={collection.id} />
          <div className="grid gap-3 md:grid-cols-2">
            {courses.map((course) => (
              <label key={course.id} className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                <input className="mt-1 w-auto" type="checkbox" name="courseIds" value={course.id} defaultChecked={selectedCourseIds.has(course.id)} />
                <span className="space-y-1">
                  <span className="block text-sm font-semibold text-stone-950">{course.title}</span>
                  <span className="block text-xs uppercase tracking-[0.22em] text-stone-500">{course.slug} · {course.status}</span>
                </span>
              </label>
            ))}
          </div>
          <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" type="submit">
            Save collection courses
          </button>
        </form>
      </Card>
    </AdminShell>
  );
}
