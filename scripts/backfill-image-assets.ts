import { prisma } from "@/lib/db/prisma";
import { ownImageUrl } from "@/lib/image-assets/ownership";
import { isRemoteImageCandidate } from "@/lib/image-assets/url";

type BackfillMode = "dry-run" | "apply";
type BackfillCandidate =
  | { kind: "course"; id: string; slug: string; field: "heroImageUrl"; url: string }
  | { kind: "bundle"; id: string; slug: string; field: "heroImageUrl"; url: string }
  | { kind: "instructor"; id: string; slug: string; field: "imageUrl"; url: string }
  | { kind: "collection"; id: string; slug: string; field: "imageUrl"; url: string }
  | { kind: "courseGallery"; id: string; slug: string; index: number; url: string }
  | { kind: "bundleGallery"; id: string; slug: string; index: number; url: string };

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

  return {
    mode: args.has("--apply") ? "apply" as BackfillMode : "dry-run" as BackfillMode,
    limit: Number.isFinite(limit) && limit && limit > 0 ? limit : undefined,
  };
}

function readGalleryUrls(config: unknown) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return [];
  }

  const urls = (config as Record<string, unknown>).galleryImageUrls;
  return Array.isArray(urls) ? urls.map((url) => String(url)).filter(Boolean) : [];
}

function replaceGalleryUrl(config: unknown, index: number, url: string) {
  const source = config && typeof config === "object" && !Array.isArray(config) ? { ...(config as Record<string, unknown>) } : {};
  const urls = Array.isArray(source.galleryImageUrls) ? [...source.galleryImageUrls].map((item) => String(item)) : [];
  urls[index] = url;
  return {
    ...source,
    galleryImageUrls: urls,
    galleryHidden: source.galleryHidden ?? false,
  };
}

async function collectCandidates(limit?: number) {
  const candidates: BackfillCandidate[] = [];
  const push = (candidate: BackfillCandidate) => {
    if (!limit || candidates.length < limit) {
      candidates.push(candidate);
    }
  };

  const [courses, bundles, instructors, collections] = await Promise.all([
    prisma.course.findMany({ select: { id: true, slug: true, heroImageUrl: true, salesPageConfig: true } }),
    prisma.bundle.findMany({ select: { id: true, slug: true, heroImageUrl: true, salesPageConfig: true } }),
    prisma.instructor.findMany({ select: { id: true, slug: true, imageUrl: true } }),
    prisma.collection.findMany({ select: { id: true, slug: true, imageUrl: true } }),
  ]);

  for (const course of courses) {
    if (isRemoteImageCandidate(course.heroImageUrl)) {
      push({ kind: "course", id: course.id, slug: course.slug, field: "heroImageUrl", url: course.heroImageUrl ?? "" });
    }
    readGalleryUrls(course.salesPageConfig).forEach((url, index) => {
      if (isRemoteImageCandidate(url)) {
        push({ kind: "courseGallery", id: course.id, slug: course.slug, index, url });
      }
    });
  }

  for (const bundle of bundles) {
    if (isRemoteImageCandidate(bundle.heroImageUrl)) {
      push({ kind: "bundle", id: bundle.id, slug: bundle.slug, field: "heroImageUrl", url: bundle.heroImageUrl ?? "" });
    }
    readGalleryUrls(bundle.salesPageConfig).forEach((url, index) => {
      if (isRemoteImageCandidate(url)) {
        push({ kind: "bundleGallery", id: bundle.id, slug: bundle.slug, index, url });
      }
    });
  }

  for (const instructor of instructors) {
    if (isRemoteImageCandidate(instructor.imageUrl)) {
      push({ kind: "instructor", id: instructor.id, slug: instructor.slug, field: "imageUrl", url: instructor.imageUrl ?? "" });
    }
  }

  for (const collection of collections) {
    if (isRemoteImageCandidate(collection.imageUrl)) {
      push({ kind: "collection", id: collection.id, slug: collection.slug, field: "imageUrl", url: collection.imageUrl ?? "" });
    }
  }

  return candidates;
}

async function updateCandidate(candidate: BackfillCandidate, ownedUrl: string) {
  if (candidate.kind === "course") {
    await prisma.course.update({ where: { id: candidate.id }, data: { heroImageUrl: ownedUrl } });
  } else if (candidate.kind === "bundle") {
    await prisma.bundle.update({ where: { id: candidate.id }, data: { heroImageUrl: ownedUrl } });
  } else if (candidate.kind === "instructor") {
    await prisma.instructor.update({ where: { id: candidate.id }, data: { imageUrl: ownedUrl } });
  } else if (candidate.kind === "collection") {
    await prisma.collection.update({ where: { id: candidate.id }, data: { imageUrl: ownedUrl } });
  } else if (candidate.kind === "courseGallery") {
    const course = await prisma.course.findUnique({ where: { id: candidate.id }, select: { salesPageConfig: true } });
    await prisma.course.update({
      where: { id: candidate.id },
      data: { salesPageConfig: replaceGalleryUrl(course?.salesPageConfig, candidate.index, ownedUrl) },
    });
  } else {
    const bundle = await prisma.bundle.findUnique({ where: { id: candidate.id }, select: { salesPageConfig: true } });
    await prisma.bundle.update({
      where: { id: candidate.id },
      data: { salesPageConfig: replaceGalleryUrl(bundle?.salesPageConfig, candidate.index, ownedUrl) },
    });
  }
}

async function main() {
  const { mode, limit } = parseArgs();
  const candidates = await collectCandidates(limit);
  const summary = {
    mode,
    candidates: candidates.length,
    copied: 0,
    reused: 0,
    failed: 0,
    skipped: 0,
    updated: 0,
  };

  if (mode === "dry-run") {
    console.log(JSON.stringify({ ...summary, sample: candidates.slice(0, 10) }, null, 2));
    return;
  }

  for (const candidate of candidates) {
    const result = await ownImageUrl(candidate.url, {
      folder: candidate.kind === "instructor" ? "instructors" : candidate.kind === "collection" ? "collections" : candidate.kind === "bundle" || candidate.kind === "bundleGallery" ? "bundles" : "courses",
      slug: candidate.slug,
      role: "index" in candidate ? `gallery-${candidate.index + 1}` : candidate.field,
    });

    if (result.status === "copied") summary.copied += 1;
    if (result.status === "reused") summary.reused += 1;
    if (result.status === "failed") summary.failed += 1;
    if (result.status === "skipped") summary.skipped += 1;

    if ((result.status === "copied" || result.status === "reused") && result.outputUrl && result.outputUrl !== candidate.url) {
      await updateCandidate(candidate, result.outputUrl);
      summary.updated += 1;
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
