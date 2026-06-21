import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const bannedProvider = "stripe";

function read(file: string) {
  return readFileSync(join(root, file), "utf8").toLowerCase();
}

function fail(message: string) {
  console.error(`Payment provider policy check failed: ${message}`);
  process.exitCode = 1;
}

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

if (packageJson.dependencies?.[bannedProvider] || packageJson.devDependencies?.[bannedProvider]) {
  fail("the unsupported provider package is still installed");
}

for (const file of [".env.example", "prisma/seed.ts", "lib/payments/adapter-registry.ts"]) {
  if (read(file).includes(bannedProvider)) {
    fail(`${file} still configures or registers the unsupported provider`);
  }
}

for (const file of [
  "lib/payments/adapters/stripe-adapter.ts",
  "lib/payments/stripe-config.ts",
  "lib/payments/wizard/test-connection.ts",
]) {
  if (existsSync(join(root, file))) {
    fail(`${file} must not exist`);
  }
}

const gatewayQueries = read("lib/payments/gateway-queries.ts");
if (!gatewayQueries.includes("unsupported_payment_providers") || !gatewayQueries.includes("notin")) {
  fail("operational gateway queries do not exclude the unsupported provider");
}

for (const file of ["app/(admin)/admin/actions.ts", "app/api/webhooks/[provider]/route.ts"]) {
  if (!read(file).includes("isunsupportedpaymentprovider")) {
    fail(`${file} does not enforce the unsupported-provider policy`);
  }
}

if (process.exitCode) process.exit();
console.log("Payment provider policy checks passed.");
