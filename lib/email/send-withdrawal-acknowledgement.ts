import { WithdrawalAcknowledgementEmail } from "@/emails/withdrawal-acknowledgement";
import { getResendClient } from "@/lib/email/resend";

export async function sendWithdrawalAcknowledgement(input: {
  to: string;
  consumerName: string;
  orderId: string;
  productTitle: string;
  submittedAt: Date;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Transactional email is not configured.");
  }

  const resend = getResendClient();
  await resend.emails.send({
    from: process.env.AUTH_EMAIL_FROM ?? "Perseus Platform <onboarding@example.com>",
    to: input.to,
    subject: `Withdrawal received for order ${input.orderId}`,
    react: WithdrawalAcknowledgementEmail({
      consumerName: input.consumerName,
      orderId: input.orderId,
      productTitle: input.productTitle,
      submittedAt: input.submittedAt.toISOString(),
    }),
  });
}
