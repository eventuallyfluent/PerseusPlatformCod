import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { listPaymentConnectors } from "@/lib/payments/adapter-registry";
import { evaluateGatewayPolicy, summarizeGatewayCapabilities } from "@/lib/payments/policy";

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
      policy: evaluateGatewayPolicy(connector.capabilities),
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
            <p className="text-sm text-stone-600">Capabilities: {summarizeGatewayCapabilities(gateway.capabilities)}</p>
            <p className="text-sm text-stone-600">Checkout model: {gateway.capabilities.checkoutModel.replaceAll("_", " ")}</p>
            <p className="text-sm text-stone-600">Tax model: {gateway.capabilities.taxModel.replaceAll("_", " ")}</p>
            <p className={`rounded-2xl px-4 py-3 text-sm ${gateway.policy.tone === "success" ? "bg-emerald-50 text-emerald-700" : gateway.policy.tone === "warning" ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-700"}`}>
              <span className="font-medium">{gateway.policy.heading}.</span> {gateway.policy.detail}
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
