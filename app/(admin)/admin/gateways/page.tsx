import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { listPaymentConnectors, findPaymentConnector } from "@/lib/payments/adapter-registry";
import { evaluateGatewayPolicy, summarizeGatewayCapabilities } from "@/lib/payments/policy";
import { resolveGatewayDefinition } from "@/lib/payments/gateway-definition";
import { createGatewayProfileAction } from "@/app/(admin)/admin/actions";
import { HardLink } from "@/components/ui/hard-link";
import { listGatewayRecords } from "@/lib/payments/gateway-queries";

export const dynamic = "force-dynamic";

export default async function GatewaysPage({
  searchParams,
}: {
  searchParams: Promise<{ connection?: string; message?: string }>;
}) {
  const query = await searchParams;
  const gatewayRows = await listGatewayRecords();
  const provisionedProviders = new Set(gatewayRows.map((gateway) => gateway.provider));
  const availableNativeConnectors = listPaymentConnectors().filter((connector) => !provisionedProviders.has(connector.provider));

  const gateways = gatewayRows.map((gateway) => {
    const connector = findPaymentConnector(gateway.provider);
    const definition = resolveGatewayDefinition(gateway, connector);

    return {
      ...gateway,
      definition,
      policy: evaluateGatewayPolicy(definition.capabilities),
    };
  });

  const connectionMessage =
    query.connection === "failed"
      ? { tone: "rose", text: decodeURIComponent(query.message ?? "Gateway update failed.") }
      : query.connection === "saved"
        ? { tone: "emerald", text: "Gateway activation updated." }
        : query.connection === "deactivated"
          ? { tone: "emerald", text: "Gateway deactivated." }
          : null;
  const compatWarning = gatewayRows.some((gateway) => gateway.schemaCompatMode === "legacy")
    ? "The deployed database is still on the older gateway schema. Viewing works, but the new generic gateway and bank-transfer fields stay limited until the latest migration runs."
    : null;

  return (
    <AdminShell title="Gateways" description="Provider-neutral payment layer. Native connectors, generic API profiles, and bank transfer live in the same admin surface.">
      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Create gateway</p>
            <h2 className="text-lg font-semibold text-stone-950">Add a generic API or bank transfer profile</h2>
            <p className="text-sm text-stone-600">This creates a real gateway record in the database, so the platform is not limited to the hardcoded native adapters.</p>
          </div>
          {connectionMessage ? (
            <p
              className={`rounded-2xl px-4 py-3 text-sm ${
                connectionMessage.tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
            >
              {connectionMessage.text}
            </p>
          ) : null}
          {compatWarning ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{compatWarning}</p> : null}
          <form action={createGatewayProfileAction} className="grid gap-4">
            <label className="grid gap-2 text-sm text-stone-700">
              <span className="font-medium text-stone-950">Display name</span>
              <input name="displayName" required className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-950" placeholder="NMI High-Risk" />
            </label>
            <label className="grid gap-2 text-sm text-stone-700">
              <span className="font-medium text-stone-950">Provider slug</span>
              <input name="provider" className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-950" placeholder="nmi-high-risk" />
              <span className="text-xs text-stone-500">Lowercase slug used internally. Leave blank to derive from the name.</span>
            </label>
            <label className="grid gap-2 text-sm text-stone-700">
              <span className="font-medium text-stone-950">Gateway kind</span>
              <select name="kind" defaultValue="generic_api" className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-950">
                <option value="generic_api">Generic API gateway</option>
                <option value="bank_transfer">Bank transfer</option>
              </select>
            </label>
            <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" disabled={Boolean(compatWarning)}>
              Create gateway profile
            </button>
          </form>
          {availableNativeConnectors.length > 0 ? (
            <div className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
              <p className="font-medium text-stone-950">Available native connectors</p>
              <p className="mt-1">{availableNativeConnectors.map((connector) => connector.displayName).join(", ")}</p>
            </div>
          ) : null}
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {gateways.map((gateway) => (
            <Card key={gateway.id} className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  {gateway.definition.kind.replaceAll("_", " ")}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${gateway.isActive ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>
                  {gateway.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-stone-950">{gateway.displayName}</h2>
                <p className="text-sm text-stone-500">{gateway.provider}</p>
              </div>
              <div className="grid gap-2 text-sm text-stone-600">
                <div>Capabilities: {summarizeGatewayCapabilities(gateway.definition.capabilities) || "Manual configuration"}</div>
                <div>Checkout model: {gateway.definition.checkoutModel.replaceAll("_", " ")}</div>
                <div>Tax model: {gateway.definition.taxModel.replaceAll("_", " ")}</div>
                <div>Settlement: {gateway.definition.settlementBehavior.replaceAll("_", " ")}</div>
                <div>Credentials stored: {gateway.credentials.length}</div>
                <div>Webhook events: {gateway.webhookEvents.length}</div>
              </div>
              <p className={`rounded-2xl px-4 py-3 text-sm ${gateway.policy.tone === "success" ? "bg-emerald-50 text-emerald-700" : gateway.policy.tone === "warning" ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-700"}`}>
                <span className="font-medium">{gateway.policy.heading}.</span> {gateway.policy.detail}
              </p>
              <HardLink href={`/admin/gateways/${gateway.id}`} className="inline-flex text-sm font-medium text-stone-950 underline">
                Configure gateway
              </HardLink>
            </Card>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
