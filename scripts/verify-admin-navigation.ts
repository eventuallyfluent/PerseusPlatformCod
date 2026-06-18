import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();

function readProjectFile(file: string) {
  return readFileSync(join(root, file), "utf8");
}

function fail(message: string) {
  console.error(`Admin navigation check failed: ${message}`);
  process.exitCode = 1;
}

function listSourceFiles(dir: string): string[] {
  const absoluteDir = join(root, dir);

  return readdirSync(absoluteDir).flatMap((entry) => {
    const absolutePath = join(absoluteDir, entry);
    const projectPath = relative(root, absolutePath).replaceAll("\\", "/");

    if (statSync(absolutePath).isDirectory()) {
      return listSourceFiles(projectPath);
    }

    return /\.(ts|tsx)$/.test(entry) ? [projectPath] : [];
  });
}

const navigationFiles = [
  ...listSourceFiles("app/(admin)/admin"),
  ...listSourceFiles("components/admin"),
  "components/ui/hard-link.tsx",
];

for (const file of navigationFiles) {
  const source = readProjectFile(file);

  if (/window\.location\.(?:assign|replace|reload)/.test(source)) {
    fail(`${file}: internal admin navigation must not force a document reload.`);
  }

  if (/<Link\b[^>]*\bprefetch=\{false\}/.test(source)) {
    fail(`${file}: admin links must retain App Router prefetching.`);
  }
}

const layoutSource = readProjectFile("app/(admin)/admin/layout.tsx");
if (!/import \{ AdminFrame \} from "@\/components\/admin\/admin-shell";/.test(layoutSource)) {
  fail("app/(admin)/admin/layout.tsx: the shared layout must own AdminFrame.");
}

if (!/<AdminFrame>\{children\}<\/AdminFrame>/.test(layoutSource)) {
  fail("app/(admin)/admin/layout.tsx: AdminFrame must persist around child routes.");
}

const shellSource = readProjectFile("components/admin/admin-shell.tsx");
if (!/export function AdminFrame[\s\S]*?<AdminNav \/>/.test(shellSource)) {
  fail("components/admin/admin-shell.tsx: AdminFrame must render the shared navigation.");
}

const navSource = readProjectFile("components/admin/admin-nav.tsx");
if (!/useLinkStatus/.test(navSource)) {
  fail("components/admin/admin-nav.tsx: navigation must expose pending feedback.");
}

if (process.exitCode) {
  process.exit();
}

console.log("Admin navigation checks passed.");
