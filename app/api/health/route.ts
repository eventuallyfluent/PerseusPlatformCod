import { prisma } from "@/lib/db/prisma";

export async function GET() {
  await prisma.$queryRaw`SELECT 1`;

  return Response.json({
    ok: true,
    timestamp: new Date().toISOString(),
    auth: {
      adminPasswordConfigured: Boolean(process.env.ADMIN_LOGIN_PASSWORD ?? process.env.AUTH_ADMIN_PASSWORD),
      adminAllowlistConfigured: Boolean(process.env.ADMIN_EMAIL_ALLOWLIST?.trim()),
    },
  });
}
