import { readFileSync } from "node:fs";
import { join } from "node:path";
import { extractLegacySalesPageMedia } from "../lib/imports/legacy-sales-page-media";

const root = process.cwd();

type BoundaryCheck = {
  file: string;
  forbidden: RegExp[];
  message: string;
};

const requestStartRoutes: BoundaryCheck[] = [
  {
    file: "app/api/imports/course-package/route.ts",
    forbidden: [/\bprocessImportBatchChunk\b/, /\bexecuteImportBatch\b/, /\bstartAndProcessImportBatchChunk\b/],
    message: "Course-package upload must only create the batch and redirect. It must not process rows in the upload request.",
  },
  {
    file: "app/api/imports/course-students/route.ts",
    forbidden: [/\bprocessImportBatchChunk\b/, /\bexecuteImportBatch\b/, /\bstartAndProcessImportBatchChunk\b/],
    message: "Course-student upload must only create the batch and redirect. It must not process rows in the upload request.",
  },
  {
    file: "app/api/imports/batches/[batchId]/execute/route.ts",
    forbidden: [/\bprocessImportBatchChunk\b/, /\bexecuteImportBatch\b/, /\bstartAndProcessImportBatchChunk\b/],
    message: "The batch start route must only move DRY_RUN to PROCESSING. Processing belongs only to the /process endpoint.",
  },
];

function readProjectFile(file: string) {
  return readFileSync(join(root, file), "utf8");
}

function fail(message: string) {
  console.error(`Import boundary check failed: ${message}`);
  process.exitCode = 1;
}

for (const check of requestStartRoutes) {
  const source = readProjectFile(check.file);
  for (const forbidden of check.forbidden) {
    if (forbidden.test(source)) {
      fail(`${check.file}: ${check.message}`);
    }
  }
}

const processRoute = readProjectFile("app/api/imports/batches/[batchId]/process/route.ts");
if (!/\bprocessImportBatchChunk\b/.test(processRoute)) {
  fail("app/api/imports/batches/[batchId]/process/route.ts must remain the only HTTP route that processes import chunks.");
}

const executeImportSource = readProjectFile("lib/imports/execute-import.ts");
const chunkMatch = executeImportSource.match(/const IMPORT_CHUNK_SIZE = (\d+);/);
const chunkSize = chunkMatch ? Number(chunkMatch[1]) : Number.NaN;
if (!Number.isFinite(chunkSize) || chunkSize > 10) {
  fail("lib/imports/execute-import.ts: IMPORT_CHUNK_SIZE must stay at or below 10 for Vercel serverless safety.");
}

const coursePackageTargetMatch = executeImportSource.match(/async function ensureCoursePackageTarget[\s\S]*?\n}\n\nasync function applyCoursePackageLessonRow/);
const coursePackageTargetSource = coursePackageTargetMatch?.[0] ?? "";
if (/\bownImportImageUrl\b|\bownImportImageUrls\b/.test(coursePackageTargetSource)) {
  fail("Course-package imports must not copy images to Blob inline. Use image backfill/audit after structure import succeeds.");
}

const extractedMedia = extractLegacySalesPageMedia(`
  <html>
    <meta property="og:image" content="https://i.ytimg.com/vi/default-video/maxresdefault.jpg">
    <a href="https://www.youtube.com/watch?v=C8IkPvk7sg4">Watch</a>
    <img src="https://payhip.com/cdn-cgi/image/format=auto,width=1600/https://pe56d.s3.amazonaws.com/o_course_hero.jpg">
  </html>
`);

if (extractedMedia.heroImageUrl?.includes("ytimg.com")) {
  fail("Legacy media extraction must not use YouTube thumbnails as course hero images.");
}

if (!extractedMedia.heroImageUrl?.includes("o_course_hero.jpg")) {
  fail("Legacy media extraction should prefer the course image when YouTube thumbnails are present.");
}

if (process.exitCode) {
  process.exit();
}

console.log("Import boundary checks passed.");
