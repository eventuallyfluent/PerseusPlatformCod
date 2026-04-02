import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { listPaymentConnectors } from "@/lib/payments/adapter-registry";

export const dynamic = "force-dynamic";

export default async function GatewaysPage() {
  const gatewayRows = await prisma.gateway.findMany({
    include: { credentials: true, webhookEvents: true },
  });
  const installedConnectors = listPaymentConnectors();
  const gateways = installedConnectors.map((connector) => {
    const gateway = gatewayRows.find((item) => item.provider === connector.provider);

    return {
      id: gateway?.id,
      provider: connector.provider,
      displayName: gateway?.displayName ?? connector.displayName,
      isActive: gateway?.isActive ?? false,
      credentialsCount: gateway?.credentials.length ?? 0,
      webhookEventsCount: gateway?.webhookEvents.length ?? 0,
      capabilities: connector.capabilities,
    };
  });

  return (
    <AdminShell title="Gateways" description="Provider-neutral checkout framework. Installed connectors can be configured and activated without rewriting commerce logic.">
      <div className="grid gap-6 md:grid-cols-2">
        {gateways.map((gateway) => (
          <Card key={gateway.provider} className="space-y-3">
            <h2 className="text-lg font-semibold text-stone-950">{gateway.displayName}</h2>
            <p className="text-sm text-stone-600">Status: {gateway.isActive ? "Active" : "Inactive"}</p>
            <p className="text-sm text-stone-600">Credentials: {gateway.credentialsCount} saved</p>
            <p className="text-sm text-stone-600">Webhook events: {gateway.webhookEventsCount}</p>
            <p className="text-sm text-stone-600">
              Capabilities:{" "}
              {[
                gateway.capabilities.supportsHostedCheckout ? "Hosted checkout" : null,
                gateway.capabilities.supportsSubscriptions ? "Subscriptions" : null,
                gateway.capabilities.supportsRefunds ? "Refunds" : null,
                gateway.capabilities.supportsPaymentPlans ? "Payment plans" : null,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            {gateway.id ? (
              <Link href={`/admin/gateways/${gateway.id}`} className="text-sm font-medium text-stone-950 underline">
                Configure
              </Link>
            ) : (
              <p className="text-sm text-stone-500">Run the seed or save credentials to provision this connector in the database.</p>
            )}
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
