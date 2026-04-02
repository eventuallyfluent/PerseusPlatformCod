import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Card } from "@/components/ui/card";
import { currencyFormatter } from "@/lib/utils";
import { getOfferById } from "@/lib/offers/get-offer-by-id";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ offerId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { offerId } = await params;
  const query = await searchParams;
  const offer = await getOfferById(offerId);

  if (!offer) {
    notFound();
  }

  const productTitle = offer.course?.title ?? offer.bundle?.title ?? offer.name;
  const bundleCourseCount = offer.bundle?.courses.length ?? 0;
  const productMeta = offer.course
    ? { label: "Instructor", value: offer.course.instructor.name }
    : offer.bundle
      ? { label: "Includes", value: `${bundleCourseCount} ${bundleCourseCount === 1 ? "course" : "courses"}` }
      : null;
  const productKind = offer.course ? "Course checkout" : offer.bundle ? "Bundle checkout" : "Checkout";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6">
          <div className="rounded-[38px] border border-[var(--border)] bg-[linear-gradient(135deg,#171412,#2d2118)] px-8 py-10 text-stone-50 shadow-[0_28px_70px_rgba(23,20,18,0.2)]">
            <p className="text-[11px] uppercase tracking-[0.36em] text-[rgba(255,237,208,0.68)]">{productKind}</p>
            <h1 className="mt-5 text-6xl leading-[0.95] tracking-[-0.05em]">{productTitle}</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-[rgba(255,245,232,0.76)]">
              Keep the buy step as clear as the course platform itself: one summary, one price, one decisive move into payment.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="space-y-2 p-5">
              <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Offer</p>
              <p className="text-lg font-semibold text-stone-950">{offer.name}</p>
            </Card>
            <Card className="space-y-2 p-5">
              <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Price</p>
              <p className="text-lg font-semibold text-stone-950">{currencyFormatter(offer.price.toString(), offer.currency)}</p>
            </Card>
            {productMeta ? (
              <Card className="space-y-2 p-5">
                <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">{productMeta.label}</p>
                <p className="text-lg font-semibold text-stone-950">{productMeta.value}</p>
              </Card>
            ) : null}
          </div>
        </div>

        <Card className="space-y-6 p-8">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-stone-400">Order summary</p>
            <p className="text-sm leading-7 text-stone-600">Review the offer, apply a coupon if you have one, then continue into hosted payment.</p>
          </div>
          {query.status === "cancelled" ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">Checkout was cancelled. You can try again at any time.</p>
          ) : null}
          <div className="grid gap-4 rounded-[24px] bg-stone-50 p-5 text-sm text-stone-600">
            <div className="flex items-center justify-between">
              <span>Offer</span>
              <span>{offer.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Price</span>
              <span>{currencyFormatter(offer.price.toString(), offer.currency)}</span>
            </div>
            {productMeta ? (
              <div className="flex items-center justify-between">
                <span>{productMeta.label}</span>
                <span>{productMeta.value}</span>
              </div>
            ) : null}
          </div>
          <CheckoutForm offerId={offer.id} />
        </Card>
      </div>
    </div>
  );
}
