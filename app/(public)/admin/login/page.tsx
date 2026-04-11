import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/public/login-form";
import { normalizeAdminReturnPath } from "@/lib/auth/return-path";
import { isPreviewLoginEnabled } from "@/lib/auth/preview-login";

const emailEnabled = Boolean(process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY);

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  const session = await auth();

  if (session?.user?.isAdmin) {
    redirect("/admin");
  }

  const query = await searchParams;
  const redirectTo = `/auth/complete?audience=admin&returnTo=${encodeURIComponent(normalizeAdminReturnPath(query.returnTo, "/admin"))}`;
  const errorMessage = query.error === "not-admin" ? "This sign-in page is only for approved admin accounts." : null;

  return (
    <LoginForm
      mode="admin"
      previewEnabled={isPreviewLoginEnabled()}
      emailEnabled={emailEnabled}
      redirectTo={redirectTo}
      errorMessage={errorMessage}
    />
  );
}
