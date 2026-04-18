import type { Metadata } from "next";
import { LoginForm } from "@/components/public/login-form";
import { normalizeLearnerReturnPath } from "@/lib/auth/return-path";
import { isPreviewLoginEnabled } from "@/lib/auth/preview-login";
import { buildNoIndexMetadata } from "@/lib/seo/metadata";

const emailEnabled = Boolean(process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY);
export const metadata: Metadata = buildNoIndexMetadata({
  title: "Student Login",
  description: "Private learner authentication page.",
  path: "/login",
});

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  const query = await searchParams;
  const redirectTo = `/auth/complete?audience=learner&returnTo=${encodeURIComponent(normalizeLearnerReturnPath(query.returnTo, "/dashboard"))}`;
  const errorMessage = query.error === "admin-only" ? "That sign-in is reserved for admin accounts. Use student login for course access." : null;

  return <LoginForm previewEnabled={isPreviewLoginEnabled()} emailEnabled={emailEnabled} redirectTo={redirectTo} errorMessage={errorMessage} />;
}
