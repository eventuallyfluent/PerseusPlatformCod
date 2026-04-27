import type { ReactNode } from "react";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveHomepageSectionAction, savePublicThemeFamilyAction } from "@/app/(admin)/admin/actions";
import { getHomepageSections } from "@/lib/homepage/get-homepage-sections";
import { getPublicThemeFamily } from "@/lib/theme/public-theme";
import {
  stringifyLinkLines,
  type HomepageCollectionsPayload,
  type HomepageEmailSignupPayload,
  type HomepageFooterPayload,
  type HomepageHeroPayload,
  type HomepageLinkItem,
  type HomepageTestimoniesPayload,
} from "@/lib/homepage/sections";

function TextInput({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-stone-900">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400"
      />
    </label>
  );
}

function TextArea({
  name,
  label,
  defaultValue,
  rows = 4,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-stone-900">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition focus:border-stone-400"
      />
    </label>
  );
}

function SectionFrame({
  type,
  title,
  description,
  position,
  enabled,
  children,
}: {
  type: string;
  title: string;
  description: string;
  position: number;
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <Card className="space-y-6 p-6">
      <form action={saveHomepageSectionAction} className="space-y-6">
        <input type="hidden" name="type" value={type} />
        <div className="flex flex-col gap-4 border-b border-stone-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-stone-950">{title}</h2>
            <p className="max-w-2xl text-sm leading-6 text-stone-600">{description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-900">Enabled</span>
              <select
                name="enabled"
                defaultValue={enabled ? "true" : "false"}
                className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </label>
            <TextInput name="position" label="Position" type="number" defaultValue={String(position)} />
          </div>
        </div>
        {children}
        <div className="flex justify-end">
          <Button type="submit">Save section</Button>
        </div>
      </form>
    </Card>
  );
}

function linkLines(items: HomepageLinkItem[]) {
  return stringifyLinkLines(items);
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [homepageSections, publicThemeFamily, approvedTestimonials, collectionRecords] = await Promise.all([
    getHomepageSections(),
    getPublicThemeFamily(),
    prisma.testimonial.findMany({
      where: { isApproved: true },
      include: {
        course: { select: { title: true } },
        bundle: { select: { title: true } },
      },
      orderBy: [{ position: "asc" }],
      take: 12,
    }),
    prisma.collection.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
      },
    }),
  ]);
  const hero = homepageSections.find((section) => section.type === "HERO")!;
  const heroPayload = hero.payload as HomepageHeroPayload;
  const collections = homepageSections.find((section) => section.type === "COLLECTIONS")!;
  const collectionsPayload = collections.payload as HomepageCollectionsPayload;
  const testimonies = homepageSections.find((section) => section.type === "TESTIMONIES")!;
  const testimoniesPayload = testimonies.payload as HomepageTestimoniesPayload;
  const selectedHomepageTestimonials = testimoniesPayload.selectedTestimonialIds ?? [];
  const emailSignup = homepageSections.find((section) => section.type === "EMAIL_SIGNUP")!;
  const emailSignupPayload = emailSignup.payload as HomepageEmailSignupPayload;
  const footer = homepageSections.find((section) => section.type === "FOOTER")!;
  const footerPayload = footer.payload as HomepageFooterPayload;
  const feedbackMessage =
    resolvedSearchParams?.saved === "theme"
      ? "Public theme family saved."
      : resolvedSearchParams?.saved
        ? "Homepage section saved."
        : resolvedSearchParams?.error === "theme"
          ? "Public theme family could not be saved. Try again."
          : resolvedSearchParams?.error
            ? "Homepage section could not be saved. Try again."
            : "";
  const feedbackTone = resolvedSearchParams?.error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700";

  return (
    <AdminShell title="Homepage Settings" description="Edit, reorder, and toggle the five public homepage sections.">
      <div className="space-y-6">
        {feedbackMessage ? <p className={`rounded-[18px] px-4 py-3 text-sm ${feedbackTone}`}>{feedbackMessage}</p> : null}
        <Card className="space-y-6 p-6">
          <form action={savePublicThemeFamilyAction} className="space-y-6">
            <div className="space-y-4 border-b border-stone-200 pb-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-stone-950">Public theme family</h2>
                <p className="max-w-2xl text-sm leading-6 text-stone-600">
                  Preserve the current public/student UI as Perseus Original or switch the live public/student family to Perseus Modern. Learners still choose dark or light mode from the public footer.
                </p>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className={`rounded-[24px] border p-5 ${publicThemeFamily === "original" ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-stone-200 bg-white"}`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-stone-950">Perseus Original</h3>
                    {publicThemeFamily === "original" ? (
                      <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                        Active
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-6 text-stone-600">
                    Keeps the current public and learner UI exactly as it is now, with the existing light and dark modes.
                  </p>
                </div>
                <div className="mt-5">
                  <Button type="submit" name="family" value="original" variant={publicThemeFamily === "original" ? "secondary" : "primary"}>
                    {publicThemeFamily === "original" ? "Original is active" : "Use Perseus Original"}
                  </Button>
                </div>
              </div>

              <div className={`rounded-[24px] border p-5 ${publicThemeFamily === "modern" ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-stone-200 bg-white"}`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-stone-950">Perseus Modern</h3>
                    {publicThemeFamily === "modern" ? (
                      <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                        Active
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-6 text-stone-600">
                    Uses the sharper premium family across public and learner surfaces while still letting visitors choose light or dark.
                  </p>
                </div>
                <div className="mt-5">
                  <Button type="submit" name="family" value="modern" variant={publicThemeFamily === "modern" ? "secondary" : "primary"}>
                    {publicThemeFamily === "modern" ? "Modern is active" : "Use Perseus Modern"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Card>
        <SectionFrame
          type="HERO"
          title="Hero"
          description="Centered opening section with Perseus brand copy and the two primary calls to action."
          position={hero.position}
          enabled={hero.enabled}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <TextInput name="eyebrow" label="Eyebrow" defaultValue={heroPayload.eyebrow} />
            <TextInput name="title" label="Title" defaultValue={heroPayload.title} />
          </div>
          <TextArea name="description" label="Description" defaultValue={heroPayload.description} rows={4} />
          <div className="grid gap-4 lg:grid-cols-2">
            <TextInput name="primaryCtaLabel" label="Primary CTA label" defaultValue={heroPayload.primaryCtaLabel} />
            <TextInput name="primaryCtaHref" label="Primary CTA href" defaultValue={heroPayload.primaryCtaHref} />
            <TextInput name="secondaryCtaLabel" label="Secondary CTA label" defaultValue={heroPayload.secondaryCtaLabel} />
            <TextInput name="secondaryCtaHref" label="Secondary CTA href" defaultValue={heroPayload.secondaryCtaHref} />
          </div>
        </SectionFrame>

        <SectionFrame
          type="COLLECTIONS"
          title="Collections"
          description="Control the homepage collections section here. Real collections are created and edited in Admin → Collections."
          position={collections.position}
          enabled={collections.enabled}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <TextInput name="eyebrow" label="Eyebrow" defaultValue={collectionsPayload.eyebrow} />
            <TextInput name="title" label="Title" defaultValue={collectionsPayload.title} />
          </div>
          <TextArea name="description" label="Description" defaultValue={collectionsPayload.description} rows={3} />
          <div className="rounded-2xl border border-stone-200 p-4">
            <p className="text-sm font-medium text-stone-900">Featured homepage collections</p>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Create collections from the collections admin area, then choose which ones should appear on the homepage.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {collectionRecords.map((collection) => (
                <label key={collection.id} className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <input
                    className="mt-1 w-auto"
                    type="checkbox"
                    name="featuredCollectionIds"
                    value={collection.id}
                    defaultChecked={(collectionsPayload.featuredCollectionIds ?? []).includes(collection.id)}
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-semibold text-stone-950">{collection.title}</span>
                    <span className="block text-xs uppercase tracking-[0.22em] text-stone-500">{collection.slug}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </SectionFrame>

        <SectionFrame
          type="TESTIMONIES"
          title="Testimonies"
          description="Homepage proof now comes from the approved testimonial bank used across products."
          position={testimonies.position}
          enabled={testimonies.enabled}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <TextInput name="eyebrow" label="Eyebrow" defaultValue={testimoniesPayload.eyebrow} />
            <TextInput name="title" label="Title" defaultValue={testimoniesPayload.title} />
          </div>
          <TextArea name="description" label="Optional description" defaultValue={testimoniesPayload.description} rows={3} />
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-900">Source mode</span>
              <select
                name="sourceMode"
                defaultValue={testimoniesPayload.sourceMode ?? "latest-approved"}
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400"
              >
                <option value="latest-approved">Latest approved</option>
                <option value="selected">Selected testimonials</option>
              </select>
            </label>
            <div className="rounded-2xl border border-stone-200 p-4">
              <p className="text-sm font-medium text-stone-900">Approved testimonial bank</p>
              <p className="mt-1 text-sm leading-6 text-stone-600">Select specific testimonials or leave the section on latest approved.</p>
              <div className="mt-4 grid gap-3">
                {approvedTestimonials.map((testimonial) => {
                  const source = testimonial.course?.title ?? testimonial.bundle?.title ?? "General";
                  return (
                    <label key={testimonial.id} className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                      <input
                        className="mt-1 w-auto"
                        type="checkbox"
                        name="selectedTestimonialIds"
                        value={testimonial.id}
                        defaultChecked={selectedHomepageTestimonials.includes(testimonial.id)}
                      />
                      <span className="space-y-1">
                        <span className="block text-sm font-semibold text-stone-950">
                          {testimonial.name ?? "Anonymous"} · {source}
                        </span>
                        <span className="block text-sm leading-6 text-stone-700">{testimonial.quote}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionFrame>

        <SectionFrame
          type="EMAIL_SIGNUP"
          title="Email Sign Up"
          description="Standalone sign-up section that sits between testimonies and the footer."
          position={emailSignup.position}
          enabled={emailSignup.enabled}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <TextInput name="eyebrow" label="Eyebrow" defaultValue={emailSignupPayload.eyebrow} />
            <TextInput name="title" label="Title" defaultValue={emailSignupPayload.title} />
          </div>
          <TextArea name="description" label="Description" defaultValue={emailSignupPayload.description} rows={3} />
          <div className="grid gap-4 lg:grid-cols-2">
            <TextInput name="inputPlaceholder" label="Input placeholder" defaultValue={emailSignupPayload.inputPlaceholder} />
            <TextInput name="buttonLabel" label="Button label" defaultValue={emailSignupPayload.buttonLabel} />
            <TextInput name="formActionUrl" label="Form action URL" defaultValue={emailSignupPayload.formActionUrl} />
            <TextArea name="legalText" label="Legal text" defaultValue={emailSignupPayload.legalText} rows={3} />
          </div>
        </SectionFrame>

        <SectionFrame
          type="FOOTER"
          title="Footer"
          description="Closing brand and navigation block. Keep signup content in the email section above, not here."
          position={footer.position}
          enabled={footer.enabled}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <TextInput name="brandTitle" label="Brand title" defaultValue={footerPayload.brandTitle} />
            <TextInput name="brandSubtitle" label="Brand subtitle" defaultValue={footerPayload.brandSubtitle} />
          </div>
          <TextArea name="brandDescription" label="Brand description" defaultValue={footerPayload.brandDescription} rows={3} />
          <div className="grid gap-4 lg:grid-cols-2">
            <TextInput name="platformHeading" label="Platform heading" defaultValue={footerPayload.platformHeading} />
            <TextInput name="legalHeading" label="Legal heading" defaultValue={footerPayload.legalHeading} />
            <TextArea name="platformLinks" label="Platform links" defaultValue={linkLines(footerPayload.platformLinks)} rows={5} />
            <TextArea name="legalLinks" label="Legal links" defaultValue={linkLines(footerPayload.legalLinks)} rows={5} />
            <TextArea name="socialLabels" label="Social labels" defaultValue={footerPayload.socialLabels.join("\n")} rows={4} />
            <div className="grid gap-4">
              <TextArea name="bottomLeftText" label="Bottom-left text" defaultValue={footerPayload.bottomLeftText} rows={2} />
              <TextArea name="bottomRightText" label="Bottom-right text" defaultValue={footerPayload.bottomRightText} rows={2} />
            </div>
          </div>
        </SectionFrame>
      </div>
    </AdminShell>
  );
}
