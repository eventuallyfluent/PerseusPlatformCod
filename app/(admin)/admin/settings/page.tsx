import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <AdminShell title="Settings" description="Phase 1 settings stay minimal and operational.">
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-950">Environment expectations</h2>
        <ul className="space-y-2 text-sm text-stone-600">
          <li>`DATABASE_URL` for Postgres and Prisma</li>
          <li>`NEXT_PUBLIC_APP_URL` for canonical URLs and redirects</li>
          <li>Gateway credentials are stored per provider in admin and should only fall back to provider-specific env vars when required.</li>
          <li>`CREDENTIAL_ENCRYPTION_KEY` or `AUTH_SECRET` for encrypting stored gateway credentials</li>
          <li>`RESEND_API_KEY` and `AUTH_EMAIL_FROM` for email delivery</li>
          <li>`ADMIN_EMAIL_ALLOWLIST` for admin access control</li>
        </ul>
      </Card>
    </AdminShell>
  );
}
