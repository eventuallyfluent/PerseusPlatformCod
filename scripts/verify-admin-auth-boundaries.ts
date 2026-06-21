import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();

function readProjectFile(file: string) {
  return readFileSync(join(root, file), "utf8");
}

function fail(message: string) {
  console.error(`Admin auth boundary check failed: ${message}`);
  process.exitCode = 1;
}

function listRouteFiles(dir: string): string[] {
  const absoluteDir = join(root, dir);

  return readdirSync(absoluteDir).flatMap((entry) => {
    const absolutePath = join(absoluteDir, entry);
    const projectPath = relative(root, absolutePath).replaceAll("\\", "/");

    if (statSync(absolutePath).isDirectory()) {
      return listRouteFiles(projectPath);
    }

    return entry === "route.ts" ? [projectPath] : [];
  });
}

const importRouteFiles = listRouteFiles("app/api/imports");

for (const file of importRouteFiles) {
  const source = readProjectFile(file);

  if (!/import \{ requireAdminRoute \} from "@\/lib\/auth\/admin-boundary";/.test(source)) {
    fail(`${file}: import routes must use requireAdminRoute.`);
  }

  if (!/\bconst unauthorized = await requireAdminRoute\(\);\s*if \(unauthorized\) return unauthorized;/.test(source)) {
    fail(`${file}: import routes must return before reading or mutating data when admin auth fails.`);
  }
}

const reportExportRoutes = [
  "app/(admin)/admin/reports/export/sales/route.ts",
  "app/(admin)/admin/reports/export/taxes/route.ts",
];

for (const file of reportExportRoutes) {
  const source = readProjectFile(file);

  if (!/import \{ requireAdmin \} from "@\/lib\/auth\/guards";/.test(source)) {
    fail(`${file}: report exports must import requireAdmin.`);
  }

  if (!/\bexport async function GET\b[\s\S]*?\{\s*await requireAdmin\(\);/.test(source)) {
    fail(`${file}: report exports must authenticate before loading report data.`);
  }
}

const adminActionFiles = [
  "app/(admin)/admin/actions.ts",
  "app/(admin)/admin/actions/coupons.ts",
  "app/(admin)/admin/actions/inquiries.ts",
  "app/(admin)/admin/actions/reviews.ts",
];

for (const file of adminActionFiles) {
  const source = readProjectFile(file);

  if (!/import \{ requireAdmin \} from "@\/lib\/auth\/guards";/.test(source)) {
    fail(`${file}: admin Server Actions must import requireAdmin.`);
  }

  const exportMatches = source.matchAll(/\bexport async function\s+([A-Za-z0-9_]+)[\s\S]*?\{\s*([\s\S]*?)(?=\n\s*(?:const|let|if|try|return|await|switch|for|while|\/|\w))/g);
  const checkedNames = new Set<string>();

  for (const match of exportMatches) {
    const name = match[1];
    checkedNames.add(name);
    const functionStart = source.indexOf(match[0]);
    const guardWindow = source.slice(functionStart, functionStart + 260);

    if (!/\{\s*(?:const\s+[A-Za-z0-9_]+\s*=\s*)?await requireAdmin\(\);/.test(guardWindow)) {
      fail(`${file}: ${name} must call requireAdmin() before doing work.`);
    }
  }

  const exportedNames = Array.from(source.matchAll(/\bexport async function\s+([A-Za-z0-9_]+)/g), (match) => match[1]);
  for (const name of exportedNames) {
    if (!checkedNames.has(name)) {
      const functionStart = source.indexOf(`export async function ${name}`);
      const guardWindow = source.slice(functionStart, functionStart + 320);

      if (!/\{\s*(?:const\s+[A-Za-z0-9_]+\s*=\s*)?await requireAdmin\(\);/.test(guardWindow)) {
        fail(`${file}: ${name} must call requireAdmin() before doing work.`);
      }
    }
  }
}

if (process.exitCode) {
  process.exit();
}

console.log("Admin auth boundary checks passed.");
