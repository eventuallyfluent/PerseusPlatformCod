import { LoginForm } from "@/components/public/login-form";
import { normalizeReturnPath } from "@/lib/auth/return-path";

const emailEnabled = Boolean(process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY);
const previewEnabled = !emailEnabled || process.env.NEXT_PUBLIC_AUTH_PREVIEW_LOGIN === "true";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const query = await searchParams;
  const redirectTo = `/auth/complete?returnTo=${encodeURIComponent(normalizeReturnPath(query.returnTo, "/dashboard"))}`;

  return <LoginForm previewEnabled={previewEnabled} emailEnabled={emailEnabled} redirectTo={redirectTo} />;
}
