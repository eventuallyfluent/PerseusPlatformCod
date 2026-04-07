import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { deleteCouponAction, saveCouponAction } from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: [{ isActive: "desc" }, { code: "asc" }],
  });

  return (
    <AdminShell title="Coupons" description="Simple discount codes for course and bundle checkout.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Card className="space-y-4 bg-white p-6">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">New coupon</p>
            <h2 className="text-2xl leading-none tracking-[-0.03em] text-stone-950">Create a discount code.</h2>
          </div>
          <form action={saveCouponAction} className="grid gap-3">
            <label>Code<input name="code" required /></label>
            <label>Amount off<input name="amountOff" type="number" min="0" step="0.01" /></label>
            <label>Percent off<input name="percentOff" type="number" min="0" max="100" step="1" /></label>
            <label>Expires at<input name="expiresAt" type="date" /></label>
            <label className="flex items-center gap-3 text-stone-700"><input className="w-auto" name="isActive" type="checkbox" value="true" defaultChecked />Active</label>
            <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">Save coupon</button>
          </form>
        </Card>

        <div className="space-y-4">
          {coupons.length === 0 ? (
            <Card className="bg-white p-6 text-sm text-stone-600">No coupons yet.</Card>
          ) : (
            coupons.map((coupon) => (
              <Card key={coupon.id} className="space-y-4 bg-white p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-stone-950">{coupon.code}</p>
                    <p className="text-sm text-stone-600">
                      {coupon.amountOff ? `$${coupon.amountOff.toString()} off` : null}
                      {coupon.amountOff && coupon.percentOff ? " · " : null}
                      {coupon.percentOff ? `${coupon.percentOff}% off` : null}
                      {!coupon.amountOff && !coupon.percentOff ? "No discount set" : null}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${coupon.isActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>
                    {coupon.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <form action={saveCouponAction} className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="couponId" value={coupon.id} />
                  <label>Code<input name="code" defaultValue={coupon.code} required /></label>
                  <label>Expires at<input name="expiresAt" type="date" defaultValue={coupon.expiresAt ? coupon.expiresAt.toISOString().slice(0, 10) : ""} /></label>
                  <label>Amount off<input name="amountOff" type="number" min="0" step="0.01" defaultValue={coupon.amountOff?.toString() ?? ""} /></label>
                  <label>Percent off<input name="percentOff" type="number" min="0" max="100" step="1" defaultValue={coupon.percentOff?.toString() ?? ""} /></label>
                  <label className="flex items-center gap-3 text-stone-700 md:col-span-2"><input className="w-auto" name="isActive" type="checkbox" value="true" defaultChecked={coupon.isActive} />Active</label>
                  <div className="flex flex-wrap gap-3 md:col-span-2">
                    <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Save coupon</button>
                    <button className="rounded-full border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700" type="submit" formAction={deleteCouponAction} name="couponId" value={coupon.id}>Delete</button>
                  </div>
                </form>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  );
}
