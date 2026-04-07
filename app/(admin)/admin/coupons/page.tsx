import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { CouponForm } from "@/components/admin/coupon-form";
import { deleteCouponAction, saveCouponAction } from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

export default async function CouponsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const coupons = await prisma.coupon.findMany({
    orderBy: [{ isActive: "desc" }, { code: "asc" }],
  });

  const saved = resolvedSearchParams?.saved ?? "";
  const error = resolvedSearchParams?.error ?? "";

  const feedbackMessage =
    saved === "created"
      ? "Coupon created."
      : saved === "updated"
        ? "Coupon updated."
        : saved === "deleted"
          ? "Coupon deleted."
          : error === "code"
            ? "Add a coupon code."
            : error === "discountType"
              ? "Choose either amount off or percentage off."
              : error === "amount"
                ? "Amount off must be greater than 0."
                : error === "percent"
                  ? "Percentage off must be between 1 and 100."
                  : "";

  return (
    <AdminShell title="Coupons" description="Simple discount codes for course and bundle checkout.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Card className="space-y-4 bg-white p-6">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">New coupon</p>
            <h2 className="text-2xl leading-none tracking-[-0.03em] text-stone-950">Create a discount code.</h2>
          </div>
          {feedbackMessage ? (
            <p className={`rounded-[18px] px-4 py-3 text-sm ${error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{feedbackMessage}</p>
          ) : null}
          <CouponForm action={saveCouponAction} />
          <div>
            <button form="new-coupon-form" className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">
              Save coupon
            </button>
          </div>
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
                      {coupon.amountOff ? `$${coupon.amountOff.toString()} off` : coupon.percentOff ? `${coupon.percentOff}% off` : "No discount set"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${coupon.isActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>
                    {coupon.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <CouponForm
                  action={saveCouponAction}
                  couponId={coupon.id}
                  defaultCode={coupon.code}
                  defaultAmountOff={coupon.amountOff?.toString() ?? ""}
                  defaultPercentOff={coupon.percentOff?.toString() ?? ""}
                  defaultExpiresAt={coupon.expiresAt ? coupon.expiresAt.toISOString().slice(0, 10) : ""}
                  defaultIsActive={coupon.isActive}
                />
                <div className="flex flex-wrap gap-3">
                  <button form={`coupon-form-${coupon.id}`} className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">
                    Save coupon
                  </button>
                  <form action={deleteCouponAction}>
                    <input type="hidden" name="couponId" value={coupon.id} />
                    <button className="rounded-full border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  );
}
