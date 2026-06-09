import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminActionBar, AdminDataTable, AdminStatusBadge, adminButtonClass } from "@/components/admin/admin-ui";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Card } from "@/components/ui/card";
import { deleteTaxRateAction, saveTaxRateAction, saveTaxSettingsAction } from "@/app/(admin)/admin/actions";
import { getTaxSettings } from "@/lib/taxes/tax-calculation";

export const dynamic = "force-dynamic";

function SelectBoolean({ name, defaultValue }: { name: string; defaultValue: boolean }) {
  return (
    <select name={name} defaultValue={defaultValue ? "true" : "false"} className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm">
      <option value="true">Enabled</option>
      <option value="false">Disabled</option>
    </select>
  );
}

export default async function TaxSettingsPage() {
  const [settings, rates] = await Promise.all([
    getTaxSettings(),
    prisma.taxRate.findMany({ orderBy: [{ country: "asc" }, { region: "asc" }, { postalCode: "asc" }] }),
  ]);
  const activeRateCount = rates.filter((rate) => rate.isActive).length;

  return (
    <AdminShell title="Tax collection" description="Configure platform tax collection for countries, regions, provinces, and postal overrides.">
      <div className="grid gap-6">
        {settings.enabled && activeRateCount === 0 ? (
          <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
            Tax collection is enabled, but no active tax rates are configured. Checkout can show tax-included pricing or request location, but it will not add or report jurisdiction tax until at least one active rate is added.
          </div>
        ) : null}

        <Card className="p-5">
          <form action={saveTaxSettingsAction} className="grid gap-4 lg:grid-cols-5">
            <label className="grid gap-2 text-sm font-medium text-stone-900">
              Collect tax
              <SelectBoolean name="enabled" defaultValue={settings.enabled} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-900">
              Prices include tax
              <SelectBoolean name="pricesIncludeTax" defaultValue={settings.pricesIncludeTax} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-900">
              Require location
              <SelectBoolean name="requireTaxLocation" defaultValue={settings.requireTaxLocation} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-900">
              All countries
              <SelectBoolean name="collectForAllCountries" defaultValue={settings.collectForAllCountries} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-900">
              Default tax name
              <input name="defaultTaxName" defaultValue={settings.defaultTaxName} className="rounded-xl border border-stone-200 px-4 py-3 text-sm" />
            </label>
            <div className="lg:col-span-5">
              <button className={adminButtonClass} type="submit">Save tax settings</button>
            </div>
          </form>
        </Card>

        <Card className="p-5">
          <form action={saveTaxRateAction} className="grid gap-4 lg:grid-cols-6">
            <label className="grid gap-2 text-sm font-medium text-stone-900">Country code<input name="country" placeholder="GB" maxLength={2} className="rounded-xl border border-stone-200 px-4 py-3 text-sm uppercase" /></label>
            <label className="grid gap-2 text-sm font-medium text-stone-900">Region/state/province<input name="region" placeholder="Optional" className="rounded-xl border border-stone-200 px-4 py-3 text-sm uppercase" /></label>
            <label className="grid gap-2 text-sm font-medium text-stone-900">Postal/postcode override<input name="postalCode" placeholder="Optional" className="rounded-xl border border-stone-200 px-4 py-3 text-sm uppercase" /></label>
            <label className="grid gap-2 text-sm font-medium text-stone-900">Tax name<input name="label" placeholder="GB VAT / AU GST / CA GST-HST / EU VAT" className="rounded-xl border border-stone-200 px-4 py-3 text-sm" /></label>
            <label className="grid gap-2 text-sm font-medium text-stone-900">Rate %<input name="ratePercent" type="number" min="0" step="0.0001" placeholder="20" className="rounded-xl border border-stone-200 px-4 py-3 text-sm" /></label>
            <label className="grid gap-2 text-sm font-medium text-stone-900">Rule<select name="ruleType" defaultValue="REPLACE" className="rounded-xl border border-stone-200 px-4 py-3 text-sm"><option value="REPLACE">Replace</option><option value="ADD">Add</option></select></label>
            <input type="hidden" name="appliesToCourses" value="true" />
            <input type="hidden" name="appliesToBundles" value="true" />
            <input type="hidden" name="appliesToSubscriptions" value="true" />
            <input type="hidden" name="appliesToAccessProducts" value="true" />
            <input type="hidden" name="isActive" value="true" />
            <div className="lg:col-span-6">
              <button className={adminButtonClass} type="submit">Add tax rate</button>
            </div>
          </form>
        </Card>

        <AdminDataTable
          columns={[{ header: "Jurisdiction" }, { header: "Tax" }, { header: "Rate" }, { header: "Applies" }, { header: "Status" }, { header: "Actions" }]}
          rows={rates.map((rate) => ({
            key: rate.id,
            cells: [
              [rate.country, rate.region, rate.postalCode].filter(Boolean).join(" / "),
              rate.label,
              `${Number(rate.ratePercent)}%`,
              [
                rate.appliesToCourses ? "courses" : null,
                rate.appliesToBundles ? "bundles" : null,
                rate.appliesToSubscriptions ? "subscriptions" : null,
                rate.appliesToAccessProducts ? "access products" : null,
              ].filter(Boolean).join(", "),
              <AdminStatusBadge key="status" tone={rate.isActive ? "success" : "neutral"}>{rate.isActive ? "Active" : "Inactive"}</AdminStatusBadge>,
              <AdminActionBar key="actions">
                <form action={deleteTaxRateAction}>
                  <input type="hidden" name="id" value={rate.id} />
                  <ConfirmSubmitButton confirmMessage="Delete this tax rate?" className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700">Delete</ConfirmSubmitButton>
                </form>
              </AdminActionBar>,
            ],
          }))}
          empty="No tax rates configured."
        />
      </div>
    </AdminShell>
  );
}
