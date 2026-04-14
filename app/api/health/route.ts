import { prisma } from "@/lib/db/prisma";
import { getActiveGatewayRecord } from "@/lib/payments/gateway-queries";
import { findPaymentConnector } from "@/lib/payments/adapter-registry";
import { resolveGatewayDefinition } from "@/lib/payments/gateway-definition";
import { evaluateGatewayOperationalReadiness } from "@/lib/payments/readiness";

export async function GET() {
  await prisma.$queryRaw`SELECT 1`;
  const activeGateway = await getActiveGatewayRecord();
  const activeConnector = activeGateway ? findPaymentConnector(activeGateway.provider) : null;
  const activeDefinition = activeGateway ? resolveGatewayDefinition(activeGateway, activeConnector) : null;
  const paymentReadiness =
    activeGateway && activeDefinition
      ? evaluateGatewayOperationalReadiness({
          gateway: activeGateway,
          definition: activeDefinition,
          connector: activeConnector,
        })
      : null;

  return Response.json({
    ok: true,
    timestamp: new Date().toISOString(),
    auth: {
      adminPasswordConfigured: Boolean(process.env.ADMIN_LOGIN_PASSWORD ?? process.env.AUTH_ADMIN_PASSWORD),
      adminAllowlistConfigured: Boolean(process.env.ADMIN_EMAIL_ALLOWLIST?.trim()),
    },
    payments: {
      activeGatewayProvider: activeGateway?.provider ?? null,
      activeGatewayReady: paymentReadiness?.canRunCheckout ?? false,
      activeGatewayStatus: paymentReadiness?.status ?? "blocked",
      activeGatewayWebhookMode: paymentReadiness?.webhookMode ?? "unavailable",
      activeGatewayIssueCount: paymentReadiness?.issues.length ?? 0,
    },
  });
}
