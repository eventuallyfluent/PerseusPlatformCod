import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { resolveCourseThankYouPath } from "@/lib/urls/resolve-course-path";
import { resolveBundleThankYouPath } from "@/lib/urls/resolve-bundle-path";
import { currencyFormatter } from "@/lib/utils";
import { LEGAL_COMPANY } from "@/lib/legal/company";
import { hasSpecificBankTransferInstructions, splitBankTransferInstructions } from "@/lib/payments/bank-transfer-instructions";

export const dynamic = "force-dynamic";

export default async function BankTransferInstructionsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      offer: {
        include: {
          course: true,
          bundle: true,
        },
      },
      payments: {
        include: {
          gateway: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const payment = order?.payments[0];

  if (!order || !payment || payment.gateway.kind !== "bank_transfer") {
    notFound();
  }

  if (order.status === "PAID") {
    if (order.offer.course) {
      redirect(`${resolveCourseThankYouPath(order.offer.course)}?order=${order.id}`);
    }

    if (order.offer.bundle) {
      redirect(`${resolveBundleThankYouPath(order.offer.bundle)}?order=${order.id}`);
    }
  }

  const productTitle = order.offer.course?.title ?? order.offer.bundle?.title ?? order.offer.name;
  const instructions = splitBankTransferInstructions(payment.gateway.instructionsMarkdown);
  const hasSpecificInstructions = hasSpecificBankTransferInstructions(payment.gateway.instructionsMarkdown);
  const amountDue = currencyFormatter(order.totalAmount.toString(), order.currency);
  const supportHref = `mailto:${LEGAL_COMPANY.supportEmail}?subject=${encodeURIComponent(`Bank transfer help for order ${order.id}`)}`;

  return (
    <div className="mx-auto flex min-h-[calc(100svh-5.5rem)] w-full max-w-4xl items-center px-6 py-8">
      <div className="perseus-checkout-form grid w-full gap-5 rounded-[22px] border border-[var(--checkout-form-panel-border)] bg-[var(--checkout-form-panel-background)] px-6 py-6 text-[var(--checkout-form-text)] shadow-[var(--checkout-form-shadow)] sm:px-8 sm:py-8">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--checkout-form-muted)]">Bank transfer</p>
          <h1 className="text-3xl leading-[0.98] tracking-[-0.045em] lg:text-[2.6rem]">Complete the transfer, then wait for confirmation.</h1>
          <p className="max-w-2xl text-sm leading-7 text-[var(--checkout-form-muted)]">
            Your order has been created for {productTitle}. Access is granted after the transfer is confirmed by admin.
          </p>
          <div className="flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--checkout-form-muted)]">
            <span className="rounded-full border border-[var(--checkout-form-panel-border)] px-4 py-2">Awaiting transfer</span>
            <span className="rounded-full border border-[var(--checkout-form-panel-border)] px-4 py-2">Manual confirmation</span>
            <span className="rounded-full border border-[var(--checkout-form-panel-border)] px-4 py-2">Access after payment review</span>
          </div>
        </div>

        <div className="perseus-checkout-summary grid gap-4 rounded-[20px] bg-[var(--checkout-summary-background)] px-5 py-5 text-sm md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--checkout-summary-muted)]">Product</p>
            <p className="font-semibold text-[var(--checkout-summary-text)]">{productTitle}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--checkout-summary-muted)]">Order reference</p>
            <p className="font-mono text-base font-semibold text-[var(--checkout-summary-text)]">{order.id}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--checkout-summary-muted)]">Amount due</p>
            <p className="text-base font-semibold text-[var(--checkout-summary-text)]">{amountDue}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--checkout-summary-muted)]">Order status</p>
            <p className="font-medium text-[var(--checkout-summary-text)]">{order.status.replaceAll("_", " ")}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--checkout-summary-muted)]">Payment status</p>
            <p className="font-medium text-[var(--checkout-summary-text)]">{payment.status.replaceAll("_", " ")}</p>
          </div>
        </div>

        <div className="rounded-[20px] border border-[var(--checkout-form-panel-border)] bg-[var(--checkout-unavailable-background)] px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--checkout-form-muted)]">Instructions</p>
          <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--checkout-form-muted)]">
            {hasSpecificInstructions ? (
              instructions.map((line) => <p key={line}>{line}</p>)
            ) : (
              <>
                <p>Bank-transfer details are not fully configured yet. Do not send payment until support confirms the receiving account details.</p>
                <ul className="ml-5 list-disc space-y-2">
                  <li>Contact support and include order reference {order.id}.</li>
                  <li>Ask for the account name, bank name, account number or IBAN/SWIFT/routing details, and accepted currency.</li>
                  <li>Use the exact order reference when instructed to transfer so payment can be matched.</li>
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="rounded-[20px] border border-[var(--checkout-form-panel-border)] bg-[var(--checkout-card-background)] px-5 py-4 text-sm leading-7 text-[var(--checkout-form-muted)]">
          <p>
            Need help? Email{" "}
            <a className="font-semibold text-[var(--checkout-card-text)] underline underline-offset-4" href={supportHref}>
              {LEGAL_COMPANY.supportEmail}
            </a>{" "}
            with the order reference above.
          </p>
        </div>
      </div>
    </div>
  );
}
