import { PurchaseConfirmationEmail } from "@/emails/purchase-confirmation";
import { getResendClient } from "@/lib/email/resend";

export async function sendPurchaseConfirmation(input: { to: string; courseTitle: string; amount: string; currency: string }) {
  if (!input.to || !process.env.RESEND_API_KEY) {
    return { skipped: true };
  }

  const resend = getResendClient();
  await resend.emails.send({
    from: process.env.AUTH_EMAIL_FROM ?? "Perseus Platform <onboarding@example.com>",
    to: input.to,
    subject: `Purchase confirmed: ${input.courseTitle}`,
    react: PurchaseConfirmationEmail({
      courseTitle: input.courseTitle,
      amount: input.amount,
      currency: input.currency,
    }),
  });

  return { skipped: false };
}
