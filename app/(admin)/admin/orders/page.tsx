import { confirmManualPaymentAction, failManualPaymentAction } from "@/app/(admin)/admin/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminActionBar, AdminDataTable, AdminStatusBadge, adminButtonClass, adminSecondaryButtonClass } from "@/components/admin/admin-ui";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const query = await searchParams;
  const orders = await prisma.order.findMany({
    take: 100,
    select: {
      id: true,
      status: true,
      totalAmount: true,
      currency: true,
      offer: {
        select: {
          name: true,
          course: { select: { title: true } },
          bundle: { select: { title: true } },
        },
      },
      user: { select: { email: true } },
      payments: {
        select: {
          id: true,
          status: true,
          gateway: {
            select: {
              displayName: true,
              kind: true,
            },
          },
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
      <AdminDataTable
        columns={[{ header: "Order" }, { header: "Customer" }, { header: "Product" }, { header: "Order status" }, { header: "Payment" }, { header: "Gateway" }, { header: "Action" }]}
        rows={orders.map((order) => {
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
                ? "Hosted/API automation path"
                : latestPayment?.gateway.kind === "native"
                  ? "Native automation path"
                  : "Unassigned";

          return {
            key: order.id,
            cells: [
              <div key="order" className="space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">{order.id.slice(0, 8)}</p>
                <p className="text-xs text-[var(--text-secondary)]">{order.totalAmount.toString()} {order.currency}</p>
              </div>,
              order.user?.email ?? "Guest",
              productTitle,
              <AdminStatusBadge key="order-status" tone={order.status === "PAID" ? "success" : order.status === "FAILED" ? "danger" : "warning"}>{order.status.replaceAll("_", " ")}</AdminStatusBadge>,
              latestPayment ? <AdminStatusBadge key="payment-status" tone={latestPayment.status === "SUCCEEDED" ? "success" : latestPayment.status === "FAILED" ? "danger" : "warning"}>{latestPayment.status.replaceAll("_", " ")}</AdminStatusBadge> : "None",
              <div key="gateway" className="space-y-1">
                <div>{latestPayment?.gateway.displayName ?? "Unassigned"}</div>
                <div className="text-xs text-[var(--text-secondary)]">{gatewayMode}</div>
              </div>,
              needsManualAction ? (
                <AdminActionBar key="actions">
                  <form action={confirmManualPaymentAction}>
                    <input type="hidden" name="paymentId" value={latestPayment.id} />
                    <button className={adminButtonClass}>Mark paid</button>
                  </form>
                  <form action={failManualPaymentAction}>
                    <input type="hidden" name="paymentId" value={latestPayment.id} />
                    <ConfirmSubmitButton confirmMessage="Mark this payment as failed?" className={adminSecondaryButtonClass}>Fail</ConfirmSubmitButton>
                  </form>
                </AdminActionBar>
              ) : (
                <span key="action" className="text-sm text-[var(--text-secondary)]">{actionLabel}</span>
              ),
            ],
          };
        })}
        empty="No orders yet."
      />
    </AdminShell>
  );
}
