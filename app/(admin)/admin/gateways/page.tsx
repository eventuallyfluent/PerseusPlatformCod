import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { AdminActionBar, AdminDataTable, AdminStatusBadge, adminButtonClass, adminSecondaryButtonClass } from "@/components/admin/admin-ui";
import { listPaymentConnectors, findPaymentConnector } from "@/lib/payments/adapter-registry";
import { evaluateGatewayPolicy, summarizeGatewayCapabilities } from "@/lib/payments/policy";
import { resolveGatewayDefinition } from "@/lib/payments/gateway-definition";
import { createGatewayProfileAction } from "@/app/(admin)/admin/actions";
import { HardLink } from "@/components/ui/hard-link";
import { listGatewayRecords } from "@/lib/payments/gateway-queries";
import { getGatewayCredentialMap } from "@/lib/payments/gateway-credential-map";
import { evaluateGatewayOperationalReadiness } from "@/lib/payments/readiness";

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
      readiness: evaluateGatewayOperationalReadiness({
        gateway,
        definition,
        connector,
        credentials: getGatewayCredentialMap(gateway.credentials),
      }),
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
    <AdminShell title="Gateways" description="Set up native providers, generic API gateways, and bank transfer in one payment admin surface.">
      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Create gateway</p>
            <h2 className="text-lg font-semibold text-stone-950">Add a generic API or bank transfer profile</h2>
            <p className="text-sm text-stone-600">Create a payment profile for a native provider, a custom API-connected gateway, or bank transfer. Some profiles support full automation and some rely on manual operator steps.</p>
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
            <button className={adminButtonClass}>
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

        <AdminDataTable
          columns={[{ header: "Gateway" }, { header: "State" }, { header: "Capabilities" }, { header: "Readiness" }, { header: "Policy" }, { header: "Actions" }]}
          rows={gateways.map((gateway) => ({
            key: gateway.id,
            cells: [
              <div key="gateway" className="space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">{gateway.displayName}</p>
                <p className="text-xs text-[var(--text-secondary)]">{gateway.provider} · {gateway.definition.kind.replaceAll("_", " ")}</p>
              </div>,
              <AdminStatusBadge key="active" tone={gateway.isActive ? "success" : "neutral"}>{gateway.isActive ? "Active" : "Inactive"}</AdminStatusBadge>,
              <div key="capabilities" className="max-w-sm text-sm leading-6">{summarizeGatewayCapabilities(gateway.definition.capabilities) || "Manual configuration"}</div>,
              <div key="readiness" className="space-y-1">
                <AdminStatusBadge tone={gateway.readiness.status === "ready" ? "success" : gateway.readiness.status === "attention" ? "warning" : "danger"}>
                  {gateway.readiness.heading}
                </AdminStatusBadge>
                <p className="text-xs leading-5 text-[var(--text-secondary)]">{gateway.readiness.detail}</p>
              </div>,
              <div key="policy" className="space-y-1">
                <AdminStatusBadge tone={gateway.policy.tone === "success" ? "success" : gateway.policy.tone === "warning" ? "warning" : "danger"}>
                  {gateway.policy.heading}
                </AdminStatusBadge>
                <p className="text-xs leading-5 text-[var(--text-secondary)]">{gateway.policy.detail}</p>
              </div>,
              <AdminActionBar key="actions">
                <HardLink href={`/admin/gateways/${gateway.id}`} className={adminSecondaryButtonClass}>
                  Configure
                </HardLink>
              </AdminActionBar>,
            ],
          }))}
          empty="No gateways yet."
        />
      </div>
    </AdminShell>
  );
}
