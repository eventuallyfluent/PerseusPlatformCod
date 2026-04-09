import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { saveGatewayCredentialsAction, testGatewayConnectionAction } from "@/app/(admin)/admin/actions";
import { getPaymentConnector } from "@/lib/payments/adapter-registry";
import { getGatewayCredentialMap } from "@/lib/payments/gateway-credential-map";

export const dynamic = "force-dynamic";

export default async function GatewayDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ connection?: string; message?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const gateway = await prisma.gateway.findUnique({
    where: { id },
    include: { credentials: true, webhookEvents: true },
  });

  if (!gateway) {
    notFound();
  }

  const connector = getPaymentConnector(gateway.provider);
  const credentials = getGatewayCredentialMap(gateway.credentials);
  const connectionMessage =
    query.connection === "ok"
      ? { tone: "emerald", text: "Connection test succeeded." }
      : query.connection === "saved"
        ? { tone: "emerald", text: "Gateway credentials saved." }
      : query.connection === "failed"
        ? { tone: "rose", text: decodeURIComponent(query.message ?? "Connection test failed.") }
        : null;

  return (
    <AdminShell title={gateway.displayName} description={`API key input, webhook setup instructions, and connection status for ${gateway.displayName}.`}>
      <Card className="space-y-4">
        {connectionMessage ? (
          <p
            className={`rounded-2xl px-4 py-3 text-sm ${
              connectionMessage.tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {connectionMessage.text}
          </p>
        ) : null}
        <form action={saveGatewayCredentialsAction} className="grid gap-4">
          <input type="hidden" name="provider" value={gateway.provider} />
          {connector.credentialFields.map((field) => (
            <label key={field.key} className="grid gap-2 text-sm text-stone-700">
              <span className="font-medium text-stone-950">{field.label}</span>
              <input
                name={`credential:${field.key}`}
                type={field.inputType}
                defaultValue={credentials[field.key] ?? ""}
                required={field.required}
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-950"
              />
              {field.description ? <span className="text-xs text-stone-500">{field.description}</span> : null}
            </label>
          ))}
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">Save credentials</button>
            <button
              className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700"
              type="submit"
              formAction={testGatewayConnectionAction}
              name="gatewayId"
              value={gateway.id}
            >
              Test connection
            </button>
          </div>
        </form>
        <p className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
          {connector.getWebhookInstructions()}
        </p>
        <div className="grid gap-2 text-sm text-stone-600">
          <div>Hosted checkout: {connector.capabilities.supportsHostedCheckout ? "Yes" : "No"}</div>
          <div>Subscriptions: {connector.capabilities.supportsSubscriptions ? "Yes" : "No"}</div>
          <div>Refunds: {connector.capabilities.supportsRefunds ? "Yes" : "No"}</div>
          <div>Payment plans: {connector.capabilities.supportsPaymentPlans ? "Yes" : "No"}</div>
          <div>Webhook events received: {gateway.webhookEvents.length}</div>
        </div>
      </Card>
    </AdminShell>
  );
}
