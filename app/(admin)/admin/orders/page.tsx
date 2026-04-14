import { confirmManualPaymentAction, failManualPaymentAction } from "@/app/(admin)/admin/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const query = await searchParams;
  const orders = await prisma.order.findMany({
    include: {
      offer: {
        include: { course: true, bundle: true },
      },
      user: true,
      payments: {
        include: {
          gateway: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const flash =
    query.saved === "payment"
      ? { tone: "emerald", text: "Payment state updated." }
      : query.error === "payment"
        ? { tone: "rose", text: "Payment update failed." }
        : null;

  return (
    <AdminShell title="Orders" description="Paid, pending, under-review, and bank transfer orders live in one queue.">
      {flash ? (
        <p className={`mb-4 rounded-2xl px-4 py-3 text-sm ${flash.tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {flash.text}
        </p>
      ) : null}
      <Card className="space-y-4 overflow-hidden p-0">
        <div className="grid grid-cols-[0.9fr_1.2fr_1.4fr_0.8fr_0.8fr_1.1fr_1.2fr] gap-4 border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
          <div>Order</div>
          <div>Customer</div>
          <div>Product</div>
          <div>Order status</div>
          <div>Payment</div>
          <div>Gateway</div>
          <div>Action</div>
        </div>
        <div className="divide-y divide-stone-200">
          {orders.map((order) => {
            const latestPayment = order.payments[0];
            const productTitle = order.offer.course?.title ?? order.offer.bundle?.title ?? order.offer.name;
            const needsManualAction =
              latestPayment &&
              (latestPayment.status === "AWAITING_BANK_TRANSFER" || latestPayment.status === "UNDER_REVIEW" || latestPayment.status === "AUTHORIZED");
            const actionLabel =
              latestPayment?.status === "AWAITING_BANK_TRANSFER"
                ? "Awaiting transfer confirmation"
                : latestPayment?.status === "UNDER_REVIEW"
                  ? "Under manual review"
                  : latestPayment?.status === "AUTHORIZED"
                    ? "Authorized, waiting for release"
                    : latestPayment
                      ? "No manual action"
                      : "Awaiting payment record";
            const gatewayMode =
              latestPayment?.gateway.kind === "bank_transfer"
                ? "Manual transfer"
                : latestPayment?.gateway.kind === "generic_api"
                  ? "Generic/manual gateway"
                  : latestPayment?.gateway.kind === "native"
                    ? "Native automation path"
                    : "Unassigned";

            return (
              <div key={order.id} className="grid grid-cols-[0.9fr_1.2fr_1.4fr_0.8fr_0.8fr_1.1fr_1.2fr] gap-4 px-4 py-4 text-sm text-stone-700">
                <div className="space-y-1">
                  <p className="font-medium text-stone-950">{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-stone-500">
                    {order.totalAmount.toString()} {order.currency}
                  </p>
                </div>
                <div>{order.user?.email ?? "Guest"}</div>
                <div>{productTitle}</div>
                <div className="font-medium text-stone-950">{order.status.replaceAll("_", " ")}</div>
                <div>{latestPayment?.status.replaceAll("_", " ") ?? "None"}</div>
                <div className="space-y-1">
                  <div>{latestPayment?.gateway.displayName ?? "Unassigned"}</div>
                  <div className="text-xs text-stone-500">{gatewayMode}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {needsManualAction ? (
                    <>
                      <form action={confirmManualPaymentAction}>
                        <input type="hidden" name="paymentId" value={latestPayment.id} />
                        <button className="rounded-full bg-stone-950 px-4 py-2 text-xs font-medium text-stone-50">Mark paid</button>
                      </form>
                      <form action={failManualPaymentAction}>
                        <input type="hidden" name="paymentId" value={latestPayment.id} />
                        <button className="rounded-full border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700">Fail</button>
                      </form>
                    </>
                  ) : (
                    <span className="text-xs text-stone-500">{actionLabel}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AdminShell>
  );
}
