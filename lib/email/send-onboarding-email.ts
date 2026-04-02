import { OnboardingEmail } from "@/emails/onboarding";
import { getResendClient } from "@/lib/email/resend";

export async function sendOnboardingEmail(input: { to: string; courseTitle: string }) {
  if (!input.to || !process.env.RESEND_API_KEY) {
    return { skipped: true };
  }

  const resend = getResendClient();
  await resend.emails.send({
    from: process.env.AUTH_EMAIL_FROM ?? "Perseus Platform <onboarding@example.com>",
    to: input.to,
    subject: `Welcome to ${input.courseTitle}`,
    react: OnboardingEmail({
      courseTitle: input.courseTitle,
    }),
  });

  return { skipped: false };
}
