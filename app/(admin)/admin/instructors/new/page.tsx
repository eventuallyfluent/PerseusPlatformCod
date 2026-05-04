import { AdminShell } from "@/components/admin/admin-shell";
import { ImageField } from "@/components/admin/image-field";
import { Card } from "@/components/ui/card";
import { saveInstructorAction } from "@/app/(admin)/admin/actions";

export default async function NewInstructorPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const uploadEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return (
    <AdminShell title="New instructor" description="Structured bio fields drive the public page.">
      <Card>
        {resolvedSearchParams?.error === "details" ? <p className="mb-6 rounded-[18px] bg-rose-50 px-4 py-3 text-sm text-rose-700">Instructor could not be created. Check the form fields and try again.</p> : null}
        <form action={saveInstructorAction} className="grid gap-4 md:grid-cols-2">
          <label>
            Name
            <input name="name" required />
          </label>
          <label>
            Slug
            <input name="slug" required />
          </label>
          <div className="md:col-span-2">
            <ImageField
              name="imageUrl"
              label="Image URL"
              previewLabel="Instructor image preview"
              uploadFolder="instructors"
              uploadEnabled={uploadEnabled}
            />
          </div>
          <label>
            Website URL
            <input name="websiteUrl" />
          </label>
          <label className="md:col-span-2">
            Short bio
            <textarea name="shortBio" rows={3} />
          </label>
          <label className="md:col-span-2">
            Long bio
            <textarea name="longBio" rows={6} />
          </label>
          <label>
            YouTube URL
            <input name="youtubeUrl" />
          </label>
          <label>
            Instagram URL
            <input name="instagramUrl" />
          </label>
          <label>
            X URL
            <input name="xUrl" />
          </label>
          <label>
            Facebook URL
            <input name="facebookUrl" />
          </label>
          <label>
            Discord URL
            <input name="discordUrl" />
          </label>
          <label>
            Telegram URL
            <input name="telegramUrl" />
          </label>
          <label className="md:col-span-2">
            Additional links
            <textarea
              name="links"
              rows={5}
              placeholder={"Article title | https://example.com/article\nPodcast interview | https://example.com/podcast"}
            />
            <span className="mt-2 block text-sm leading-6 text-stone-600">Add one link per line using: Label | URL. Use this for articles, interviews, blog posts, podcasts, or teacher resources.</span>
          </label>
          <div className="md:col-span-2">
            <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">Create instructor</button>
          </div>
        </form>
      </Card>
    </AdminShell>
  );
}
