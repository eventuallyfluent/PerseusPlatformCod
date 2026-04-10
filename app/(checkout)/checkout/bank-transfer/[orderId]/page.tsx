import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

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

  const productTitle = order.offer.course?.title ?? order.offer.bundle?.title ?? order.offer.name;
  const instructions = payment.gateway.instructionsMarkdown?.split("\n").filter(Boolean) ?? [];

  return (
    <div className="mx-auto flex min-h-[calc(100svh-5.5rem)] w-full max-w-4xl items-center px-6 py-8">
      <div className="grid w-full gap-5 rounded-[34px] border border-[rgba(255,255,255,0.08)] bg-[rgba(19,21,42,0.94)] px-8 py-8 text-white shadow-[0_24px_60px_rgba(14,12,30,0.2)]">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[rgba(228,216,255,0.72)]">Bank transfer</p>
          <h1 className="text-3xl leading-[0.98] tracking-[-0.045em] lg:text-[2.6rem]">Complete the transfer, then wait for confirmation.</h1>
          <p className="max-w-2xl text-sm leading-7 text-[rgba(236,229,255,0.76)]">
            Your order has been created for {productTitle}. Access is granted after the payment is confirmed in admin.
          </p>
        </div>

        <div className="grid gap-4 rounded-[24px] bg-white px-5 py-5 text-sm text-stone-700 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Reference</p>
            <p className="font-mono text-base font-semibold text-stone-950">{order.id}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Amount due</p>
            <p className="text-base font-semibold text-stone-950">
              {order.totalAmount.toString()} {order.currency}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Order status</p>
            <p className="font-medium text-stone-950">{order.status.replaceAll("_", " ")}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Payment status</p>
            <p className="font-medium text-stone-950">{payment.status.replaceAll("_", " ")}</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(228,216,255,0.72)]">Instructions</p>
          <div className="mt-3 space-y-3 text-sm leading-7 text-[rgba(236,229,255,0.82)]">
            {instructions.length > 0 ? (
              instructions.map((line) => <p key={line}>{line}</p>)
            ) : (
              <>
                <p>Send the transfer using the bank account configured for this gateway.</p>
                <p>Include the order reference exactly as shown above so the payment can be matched.</p>
                <p>Enrollment is granted after the transfer is confirmed.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
