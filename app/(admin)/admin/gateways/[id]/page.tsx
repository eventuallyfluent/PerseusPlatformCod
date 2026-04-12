import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { saveGatewayConfigurationAction, setGatewayActiveStateAction, testGatewayConnectionAction } from "@/app/(admin)/admin/actions";
import { findPaymentConnector } from "@/lib/payments/adapter-registry";
import { getGatewayCredentialMap } from "@/lib/payments/gateway-credential-map";
import { evaluateGatewayPolicy, summarizeGatewayCapabilities } from "@/lib/payments/policy";
import { getGatewayCredentialLines, resolveGatewayDefinition } from "@/lib/payments/gateway-definition";
import { getGatewayRecordById } from "@/lib/payments/gateway-queries";

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
  const gateway = await getGatewayRecordById(id);

  if (!gateway) {
    notFound();
  }

  const connector = findPaymentConnector(gateway.provider);
  const definition = resolveGatewayDefinition(gateway, connector);
  const policy = evaluateGatewayPolicy(definition.capabilities);
  const credentials = getGatewayCredentialMap(gateway.credentials);
  const genericCredentialLines = getGatewayCredentialLines(
    Object.entries(credentials).map(([key, value]) => ({
      key,
      value,
    })),
  );
  const connectionMessage =
    query.connection === "ok"
      ? { tone: "emerald", text: "Connection test succeeded." }
      : query.connection === "saved"
        ? { tone: "emerald", text: "Gateway configuration saved." }
        : query.connection === "created"
          ? { tone: "emerald", text: "Gateway profile created." }
          : query.connection === "failed"
            ? { tone: "rose", text: decodeURIComponent(query.message ?? "Gateway update failed.") }
            : null;
  const compatWarning =
    gateway.schemaCompatMode === "legacy"
      ? "This environment is still reading the older gateway schema. Core native credentials remain visible, but the new generic gateway fields will stay limited until the latest migration runs."
      : null;

  return (
    <AdminShell title={gateway.displayName} description="Configure how this payment method behaves in checkout, what it requires operationally, and what still needs manual handling.">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
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
          {compatWarning ? <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{compatWarning}</p> : null}
          <form action={saveGatewayConfigurationAction} className="grid gap-4">
            <input type="hidden" name="gatewayId" value={gateway.id} />
            <label className="grid gap-2 text-sm text-stone-700">
              <span className="font-medium text-stone-950">Display name</span>
              <input name="displayName" defaultValue={gateway.displayName} required className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-950" />
            </label>
            <label className="grid gap-2 text-sm text-stone-700">
              <span className="font-medium text-stone-950">Description</span>
              <textarea
                name="description"
                defaultValue={gateway.description ?? ""}
                rows={3}
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-950"
                placeholder="What this gateway is for, operator notes, or setup context."
              />
            </label>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm text-stone-700">
                <span className="font-medium text-stone-950">Gateway kind</span>
                <select
                  name="kind"
                  defaultValue={definition.kind}
                  disabled={definition.kind === "native"}
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-950 disabled:bg-stone-100"
                >
                  <option value="native">Native adapter</option>
                  <option value="generic_api">Generic API gateway</option>
                  <option value="bank_transfer">Bank transfer</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm text-stone-700">
                <span className="font-medium text-stone-950">Checkout model</span>
                <select
                  name="checkoutModel"
                  defaultValue={definition.checkoutModel}
                  disabled={definition.kind === "native" || definition.kind === "bank_transfer"}
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-950 disabled:bg-stone-100"
                >
                  <option value="hosted_redirect">Hosted redirect</option>
                  <option value="embedded_hosted_form">Embedded hosted form</option>
                  <option value="direct_api">Direct API</option>
                  <option value="manual_instructions">Manual instructions</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm text-stone-700">
                <span className="font-medium text-stone-950">Tax model</span>
                <select
                  name="taxModel"
                  defaultValue={definition.taxModel}
                  disabled={definition.kind === "native"}
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-950 disabled:bg-stone-100"
                >
                  <option value="merchant_of_record">Merchant of record</option>
                  <option value="gateway_tax_engine">Gateway tax engine</option>
                  <option value="external_tax_service">External tax service</option>
                  <option value="unsupported">Unsupported</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-stone-700">
                <span className="font-medium text-stone-950">Settlement behavior</span>
                <select
                  name="settlementBehavior"
                  defaultValue={definition.settlementBehavior}
                  disabled={definition.kind === "native"}
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-950 disabled:bg-stone-100"
                >
                  <option value="instant">Instant</option>
                  <option value="asynchronous">Asynchronous</option>
                  <option value="manual_review_possible">Manual review possible</option>
                  <option value="manual_confirmation">Manual confirmation</option>
                </select>
              </label>
              <div className="rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-700">
                <p className="font-medium text-stone-950">{gateway.isActive ? "Active gateway" : "Inactive gateway"}</p>
                <p className="mt-1 text-xs text-stone-500">Use the button below to make this gateway active and automatically deselect the current one.</p>
              </div>
            </div>

            {definition.kind !== "native" ? (
              <>
                <label className="grid gap-2 text-sm text-stone-700">
                  <span className="font-medium text-stone-950">Hosted checkout URL template</span>
                  <input
                    name="checkoutUrlTemplate"
                    defaultValue={gateway.checkoutUrlTemplate ?? ""}
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-950"
                    placeholder="https://gateway.example/checkout?order={{orderId}}&amount={{amount}}"
                  />
                  <span className="text-xs text-stone-500">Available placeholders include {`{{orderId}}`}, {`{{offerId}}`}, {`{{amount}}`}, {`{{currency}}`}, {`{{successUrl}}`}, {`{{cancelUrl}}`} and encoded variants ending in `Encoded`.</span>
                </label>
                <label className="grid gap-2 text-sm text-stone-700">
                  <span className="font-medium text-stone-950">Manual instructions / operator notes</span>
                  <textarea
                    name="instructionsMarkdown"
                    rows={5}
                    defaultValue={gateway.instructionsMarkdown ?? ""}
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-950"
                    placeholder="Bank details, transfer instructions, or generic gateway setup notes."
                  />
                </label>
                <label className="grid gap-2 text-sm text-stone-700">
                  <span className="font-medium text-stone-950">Generic credentials</span>
                  <textarea
                    name="genericCredentials"
                    rows={6}
                    defaultValue={genericCredentialLines}
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 font-mono text-sm text-stone-950"
                    placeholder={"merchant_id=...\napi_key=...\nterminal_id=..."}
                  />
                  <span className="text-xs text-stone-500">Use one `key=value` pair per line. This is the operator fallback for API-connected gateways that do not have a dedicated native adapter yet.</span>
                </label>
              </>
            ) : null}

            {connector ? (
              <div className="grid gap-4">
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
              </div>
            ) : null}

            {definition.kind !== "native" ? (
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["supportsHostedCheckout", "Supports hosted checkout"],
                  ["supportsSubscriptions", "Supports subscriptions"],
                  ["supportsRefunds", "Supports refunds"],
                  ["supportsPaymentPlans", "Supports payment plans"],
                  ["supportsTaxCalculation", "Supports tax calculation"],
                  ["supportsHostedTaxCollection", "Supports hosted tax collection"],
                  ["taxRequiresExternalConfiguration", "Requires external tax setup"],
                  ["actsAsMerchantOfRecord", "Acts as merchant of record"],
                  ["requiresBillingAddress", "Requires billing address"],
                  ["requiresShippingAddress", "Requires shipping address"],
                  ["requiresBusinessIdentity", "Requires business identity"],
                  ["mayRequireManualReview", "May require manual review"],
                  ["supportsManualConfirmation", "Supports manual confirmation"],
                  ["suitableForHighRisk", "Suitable for high-risk products"],
                ].map(([name, label]) => (
                  <label key={name} className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-700">
                    <input type="checkbox" name={name} defaultChecked={definition.capabilities[name as keyof typeof definition.capabilities] as boolean} />
                    <span className="font-medium text-stone-950">{label}</span>
                  </label>
                ))}
              </div>
            ) : null}

            <label className="grid gap-2 text-sm text-stone-700">
              <span className="font-medium text-stone-950">Webhook instructions</span>
              <textarea
                name="webhookInstructions"
                rows={3}
                defaultValue={gateway.webhookInstructions ?? connector?.getWebhookInstructions() ?? ""}
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-950"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">Save gateway</button>
              <button
                className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700"
                type="submit"
                formAction={setGatewayActiveStateAction}
                name="makeActive"
                value={gateway.isActive ? "false" : "true"}
              >
                {gateway.isActive ? "Deactivate gateway" : "Make active"}
              </button>
              {connector ? (
                <button
                  className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700"
                  type="submit"
                  formAction={testGatewayConnectionAction}
                  name="gatewayId"
                  value={gateway.id}
                >
                  Test connection
                </button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-stone-950">Capability truth</h2>
            <p className="text-sm text-stone-600">This is the checkout truth for this gateway: what is automated, what still requires setup, and where manual handling is expected.</p>
          </div>
          <p className={`rounded-2xl px-4 py-3 text-sm ${policy.tone === "success" ? "bg-emerald-50 text-emerald-700" : policy.tone === "warning" ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-700"}`}>
            <span className="font-medium">{policy.heading}.</span> {policy.detail}
          </p>
          <div className="grid gap-2 text-sm text-stone-600">
            <div>Capabilities: {summarizeGatewayCapabilities(definition.capabilities) || "Manual configuration"}</div>
            <div>Provider: {gateway.provider}</div>
            <div>Kind: {definition.kind.replaceAll("_", " ")}</div>
            <div>Checkout model: {definition.checkoutModel.replaceAll("_", " ")}</div>
            <div>Tax model: {definition.taxModel.replaceAll("_", " ")}</div>
            <div>Settlement behavior: {definition.settlementBehavior.replaceAll("_", " ")}</div>
            <div>Merchant of Record: {definition.capabilities.actsAsMerchantOfRecord ? "Yes" : "No"}</div>
            <div>Tax calculation support: {definition.capabilities.supportsTaxCalculation ? "Yes" : "No"}</div>
            <div>Hosted tax collection: {definition.capabilities.supportsHostedTaxCollection ? "Yes" : "No"}</div>
            <div>Manual confirmation: {definition.capabilities.supportsManualConfirmation ? "Yes" : "No"}</div>
            <div>Manual review possible: {definition.capabilities.mayRequireManualReview ? "Yes" : "No"}</div>
            <div>Billing address required: {definition.capabilities.requiresBillingAddress ? "Yes" : "No"}</div>
            <div>Business identity required: {definition.capabilities.requiresBusinessIdentity ? "Yes" : "No"}</div>
            <div>High-risk ready: {definition.capabilities.suitableForHighRisk ? "Yes" : "No"}</div>
            <div>Webhook events received: {gateway.webhookEvents.length}</div>
          </div>
          <p className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
            {gateway.webhookInstructions ?? connector?.getWebhookInstructions() ?? "Manual and generic gateways can rely on admin confirmation until webhook automation is wired."}
          </p>
          <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
            <p className="font-medium text-stone-950">Operator note</p>
            <p className="mt-1">
              Native connectors are the strongest automation path. Generic API gateways may still depend on external documentation, provider-side setup, and manual verification. Bank transfer always depends on manual payment confirmation.
            </p>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
