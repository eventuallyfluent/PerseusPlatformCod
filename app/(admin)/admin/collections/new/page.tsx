import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { saveCollectionAction } from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

export default function NewCollectionPage() {
  return (
    <AdminShell
      title="New collection"
      description="Create a collection page with its own image, description, and course grouping."
    >
      <Card className="max-w-4xl bg-white p-8">
        <form action={saveCollectionAction} className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              Eyebrow
              <input name="eyebrow" />
            </label>
            <label>
              Position
              <input name="position" type="number" min="1" defaultValue={1} />
            </label>
            <label>
              Title
              <input name="title" required />
            </label>
            <label>
              Slug
              <input name="slug" required />
            </label>
            <label>
              Tone
              <select name="tone" defaultValue="arcane">
                <option value="arcane">Arcane</option>
                <option value="discipline">Discipline</option>
                <option value="gateway">Gateway</option>
              </select>
            </label>
            <label>
              Image URL
              <input name="imageUrl" placeholder="https://..." />
            </label>
          </div>
          <label className="block">
            Description
            <textarea name="description" rows={5} required />
          </label>
          <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" type="submit">
            Create collection
          </button>
        </form>
      </Card>
    </AdminShell>
  );
}
