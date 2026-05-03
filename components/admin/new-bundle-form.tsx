"use client";

import { useActionState } from "react";
import { createBundleFormAction } from "@/app/(admin)/admin/actions";
import { emptyBundleFormState, type BundleFormState } from "@/lib/admin/bundle-form-state";
import { BundleCoursePicker } from "@/components/admin/bundle-course-picker";
import { ImageField } from "@/components/admin/image-field";
import { ProductFormSection } from "@/components/admin/product-form-shell";

type CourseOption = {
  id: string;
  title: string;
  subtitle?: string | null;
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-sm font-medium text-rose-700">{message}</p> : null;
}

function errorInputClass(state: BundleFormState, field: keyof BundleFormState["fieldErrors"]) {
  return state.fieldErrors[field] ? "border-rose-300 bg-rose-50" : undefined;
}

export function NewBundleForm({
  courses,
  uploadEnabled,
}: {
  courses: CourseOption[];
  uploadEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(createBundleFormAction, emptyBundleFormState);
  const values = state.values;

  return (
    <form action={formAction} className="space-y-8">
      {state.formError ? (
        <div className="rounded-[18px] bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-800">
          <p className="font-semibold">{state.formError}</p>
          {Object.entries(state.fieldErrors).length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {Object.entries(state.fieldErrors).map(([field, message]) => (
                message ? <li key={field}>{field}: {message}</li> : null
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <ProductFormSection
        title="Core identity"
        description="These fields define the bundle name, route, and publish state before the included course list is attached."
      >
        <label>
          Title
          <input name="title" required placeholder="Ritual Library Bundle" defaultValue={values.title} className={errorInputClass(state, "title")} />
          <FieldError message={state.fieldErrors.title} />
        </label>
        <label>
          Slug
          <input name="slug" required placeholder="ritual-library-bundle" defaultValue={values.slug} className={errorInputClass(state, "slug")} />
          <FieldError message={state.fieldErrors.slug} />
        </label>
        <label>
          Subtitle
          <input name="subtitle" placeholder="A compact line for the hero section" defaultValue={values.subtitle} className={errorInputClass(state, "subtitle")} />
          <FieldError message={state.fieldErrors.subtitle} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={values.status} className={errorInputClass(state, "status")}>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
          <FieldError message={state.fieldErrors.status} />
        </label>
      </ProductFormSection>

      <ProductFormSection
        title="Sales copy"
        description="These structured fields feed the bundle landing page and explain what is included in the bundle."
      >
        <label className="md:col-span-2">
          Short description
          <textarea name="shortDescription" rows={4} placeholder="A concise statement of the combined offer." defaultValue={values.shortDescription} className={errorInputClass(state, "shortDescription")} />
          <FieldError message={state.fieldErrors.shortDescription} />
        </label>
        <label className="md:col-span-2">
          Long description
          <textarea name="longDescription" rows={6} placeholder="Explain why these courses belong together and what one checkout unlocks." defaultValue={values.longDescription} className={errorInputClass(state, "longDescription")} />
          <FieldError message={state.fieldErrors.longDescription} />
        </label>
        <label>
          Outcomes (one per line)
          <textarea name="learningOutcomes" rows={4} placeholder={"Build a core study library\nUnlock the full path in one purchase"} defaultValue={values.learningOutcomes} className={errorInputClass(state, "learningOutcomes")} />
          <FieldError message={state.fieldErrors.learningOutcomes} />
        </label>
        <label>
          Who it&apos;s for (one per line)
          <textarea name="whoItsFor" rows={4} placeholder={"Readers who want a starter library\nStudents who prefer one purchase"} defaultValue={values.whoItsFor} className={errorInputClass(state, "whoItsFor")} />
          <FieldError message={state.fieldErrors.whoItsFor} />
        </label>
        <label>
          Includes (one per line)
          <textarea name="includes" rows={4} placeholder={"Included course access\nBundle pricing"} defaultValue={values.includes} className={errorInputClass(state, "includes")} />
          <FieldError message={state.fieldErrors.includes} />
        </label>
        <div className="hidden md:block" />
      </ProductFormSection>

      <ProductFormSection
        title="Pricing"
        description="Set the real live bundle price now so the generated sales page and checkout are usable from first save."
      >
        <label>
          Price
          <input name="price" type="number" min="0" step="0.01" defaultValue={values.price} className={errorInputClass(state, "price")} />
          <FieldError message={state.fieldErrors.price} />
        </label>
        <label>
          Currency
          <input name="currency" defaultValue={values.currency} className={errorInputClass(state, "currency")} />
          <FieldError message={state.fieldErrors.currency} />
        </label>
        <label>
          Compare-at price
          <input name="compareAtPrice" type="number" min="0" step="0.01" defaultValue={values.compareAtPrice} className={errorInputClass(state, "compareAtPrice")} />
          <FieldError message={state.fieldErrors.compareAtPrice} />
        </label>
        <div className="hidden md:block" />
      </ProductFormSection>

      <ProductFormSection
        title="Included courses"
        description="Choose the courses this bundle unlocks. These are written on first save so the public bundle page can list every included course immediately."
      >
        <div className="md:col-span-2">
          <BundleCoursePicker courses={courses} selectedIds={values.courseIds} emptyLabel="No courses match this search." />
        </div>
      </ProductFormSection>

      <ProductFormSection
        title="Media and SEO"
        description="Use media only if it strengthens the bundle promise. Search metadata can stay blank until final polish."
      >
        <ImageField
          name="heroImageUrl"
          label="Bundle cover image URL"
          defaultValue={values.heroImageUrl}
          previewLabel="Cover preview"
          uploadFolder="bundles"
          uploadEnabled={uploadEnabled}
        />
        <FieldError message={state.fieldErrors.heroImageUrl} />
        <label>
          Sales video URL
          <input name="salesVideoUrl" placeholder="https://streamable.com/..." defaultValue={values.salesVideoUrl} className={errorInputClass(state, "salesVideoUrl")} />
          <FieldError message={state.fieldErrors.salesVideoUrl} />
        </label>
        <label>
          SEO title
          <input name="seoTitle" placeholder="Optional search title override" defaultValue={values.seoTitle} className={errorInputClass(state, "seoTitle")} />
          <FieldError message={state.fieldErrors.seoTitle} />
        </label>
        <label className="md:col-span-2">
          SEO description
          <textarea name="seoDescription" rows={3} placeholder="Optional search description override." defaultValue={values.seoDescription} className={errorInputClass(state, "seoDescription")} />
          <FieldError message={state.fieldErrors.seoDescription} />
        </label>
      </ProductFormSection>

      <ProductFormSection
        title="Migration and URL preservation"
        description="Only set this when recreating an existing live path. The platform preserves exact public paths intentionally."
      >
        <label className="md:col-span-2">
          Legacy URL
          <input name="legacyUrl" placeholder="/bundle/archive-library" defaultValue={values.legacyUrl} className={errorInputClass(state, "legacyUrl")} />
          <FieldError message={state.fieldErrors.legacyUrl} />
        </label>
      </ProductFormSection>

      <div className="border-t border-[var(--border)] pt-6">
        <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={pending}>
          {pending ? "Creating bundle..." : "Create bundle"}
        </button>
      </div>
    </form>
  );
}
