import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { buildNoIndexMetadata } from "@/lib/seo/metadata";
import { getWithdrawalDeadline, isWithinWithdrawalPeriod } from "@/lib/payments/contract-withdrawals";
import { confirmContractWithdrawalAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildNoIndexMetadata({
  title: "Withdraw From a Contract",
  description: "Submit and retain confirmation of a statutory contract withdrawal.",
  path: "/withdraw",
});

function productTitle(order: {
  offer: { name: string; course: { title: string } | null; bundle: { title: string } | null; accessProduct: { title: string } | null };
}) {
  return order.offer.accessProduct?.title ?? order.offer.course?.title ?? order.offer.bundle?.title ?? order.offer.name;
}

function statusLabel(status: string) {
  if (status === "REFUNDED") return "Refund completed";
  if (status === "REFUND_PROCESSING") return "Refund processing";
  if (status === "REFUND_FAILED") return "Received - refund needs attention";
  return "Withdrawal received - refund queued";
}

export default async function WithdrawPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; submitted?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) redirect("/login?returnTo=/withdraw");

  const query = await searchParams;
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id, status: { in: ["PAID", "REFUNDED"] } },
    include: {
      contractWithdrawal: true,
      offer: { include: { course: true, bundle: true, accessProduct: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const selectedOrder = query.order ? orders.find((order) => order.id === query.order) : null;
  const submitted = query.submitted
    ? orders.map((order) => order.contractWithdrawal).find((withdrawal) => withdrawal?.id === query.submitted)
    : null;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12 sm:py-16">
      <div className="space-y-8">
        <header className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">Contract withdrawal</p>
          <h1 className="text-4xl text-[var(--foreground)] sm:text-5xl">Withdraw from a contract</h1>
          <p className="max-w-3xl text-base leading-7 text-[var(--foreground-soft)]">
            Use this function to exercise a statutory right of withdrawal for an eligible online purchase. You will review the contract before a separate confirmation step.
          </p>
        </header>

        {submitted ? (
          <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold text-[var(--accent)]">Withdrawal submitted</p>
            <h2 className="mt-2 text-2xl text-[var(--foreground)]">{statusLabel(submitted.status)}</h2>
            <dl className="mt-5 grid gap-3 text-sm text-[var(--foreground-soft)] sm:grid-cols-2">
              <div><dt className="font-semibold text-[var(--foreground)]">Receipt</dt><dd>{submitted.id}</dd></div>
              <div><dt className="font-semibold text-[var(--foreground)]">Submitted</dt><dd>{submitted.submittedAt.toISOString()}</dd></div>
              <div><dt className="font-semibold text-[var(--foreground)]">Order</dt><dd>{submitted.orderId}</dd></div>
              <div><dt className="font-semibold text-[var(--foreground)]">Refund due</dt><dd>{submitted.refundDueAt.toISOString()}</dd></div>
              <div><dt className="font-semibold text-[var(--foreground)]">Acknowledgement</dt><dd>{submitted.acknowledgementSentAt ? `Sent to ${submitted.acknowledgementEmail}` : "Saved here; email delivery needs attention"}</dd></div>
            </dl>
          </section>
        ) : null}

        {selectedOrder && !selectedOrder.contractWithdrawal && isWithinWithdrawalPeriod(selectedOrder.createdAt) ? (
          <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold text-[var(--accent)]">Confirm withdrawal</p>
            <h2 className="mt-2 text-2xl text-[var(--foreground)]">{productTitle(selectedOrder)}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--foreground-soft)]">Order {selectedOrder.id}. Confirming records your unequivocal statement to withdraw, removes access linked only to this order, and starts the refund process.</p>
            {query.error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Check your details and confirm that this order remains eligible.</p> : null}
            <form action={confirmContractWithdrawalAction} className="mt-6 grid gap-4">
              <input type="hidden" name="orderId" value={selectedOrder.id} />
              <label className="grid gap-2 text-sm font-semibold text-[var(--foreground)]">
                Your name
                <input name="consumerName" required maxLength={200} defaultValue={session.user.name ?? ""} className="min-h-12 rounded-xl border border-[var(--border)] bg-[var(--surface-panel)] px-4 font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[var(--foreground)]">
                Email for acknowledgement
                <input name="acknowledgementEmail" type="email" required maxLength={320} defaultValue={session.user.email} className="min-h-12 rounded-xl border border-[var(--border)] bg-[var(--surface-panel)] px-4 font-normal" />
              </label>
              <div className="flex flex-wrap gap-3">
                <button type="submit" className="rounded-full bg-[var(--button-primary-background)] px-6 py-3 text-sm font-semibold text-white">
                  Confirm withdrawal
                </button>
                <Link href="/withdraw" className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--foreground)]">Go back</Link>
              </div>
            </form>
          </section>
        ) : (
          <section className="space-y-4">
            <h2 className="text-2xl text-[var(--foreground)]">Your online purchases</h2>
            {orders.length ? orders.map((order) => {
              const eligible = order.status === "PAID" && isWithinWithdrawalPeriod(order.createdAt) && !order.contractWithdrawal;
              return (
                <article key={order.id} className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-panel)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl text-[var(--foreground)]">{productTitle(order)}</h3>
                      <p className="mt-1 text-sm text-[var(--foreground-soft)]">Order {order.id}</p>
                      <p className="mt-1 text-sm text-[var(--foreground-soft)]">Purchased {order.createdAt.toISOString()}</p>
                    </div>
                    {order.contractWithdrawal ? (
                      <Link href={`/withdraw?submitted=${order.contractWithdrawal.id}`} className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)]">View receipt</Link>
                    ) : eligible ? (
                      <Link href={`/withdraw?order=${order.id}`} className="rounded-full bg-[var(--button-primary-background)] px-5 py-2.5 text-sm font-semibold text-white">Withdraw from contract</Link>
                    ) : (
                      <span className="text-sm text-[var(--foreground-soft)]">Online period ended {getWithdrawalDeadline(order.createdAt).toISOString()}</span>
                    )}
                  </div>
                </article>
              );
            }) : <p className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-panel)] p-5 text-[var(--foreground-soft)]">No paid online orders were found for this account.</p>}
          </section>
        )}

        <p className="text-sm leading-6 text-[var(--foreground-soft)]">This online function does not limit longer contractual refund promises or other remedies available under applicable law. See the <Link href="/refund-policy" className="font-semibold text-[var(--accent)] underline">refund policy</Link>.</p>
      </div>
    </div>
  );
}
