import { prisma } from "@/lib/db/prisma";
import { decryptGatewayCredentialValue } from "@/lib/payments/gateway-credentials";

type StripeConfig = {
  secretKey?: string;
  webhookSecret?: string;
};

export async function getStripeConfig(): Promise<StripeConfig> {
  const gateway = await prisma.gateway.findUnique({
    where: { provider: "stripe" },
    include: { credentials: true },
  });

  return {
    secretKey:
      process.env.STRIPE_SECRET_KEY ??
      decryptGatewayCredentialValue(gateway?.credentials.find((credential) => credential.key === "api_key")?.valueEncrypted),
    webhookSecret:
      process.env.STRIPE_WEBHOOK_SECRET ??
      decryptGatewayCredentialValue(gateway?.credentials.find((credential) => credential.key === "webhook_secret")?.valueEncrypted),
  };
}
