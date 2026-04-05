"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AuthEntryShell } from "@/components/public/auth-entry-shell";

export function LoginForm({ previewEnabled, emailEnabled }: { previewEnabled: boolean; emailEnabled: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <AuthEntryShell
      eyebrow="Returning students"
      title="Return to your study space."
      description="Use the email connected to your Perseus access and we will send you a sign-in link."
      successMessage={sent ? "Check your email for the sign-in link." : null}
    >
      {emailEnabled ? (
        <>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">Sign in</p>
            <p className="text-sm leading-7 text-[var(--foreground-soft)]">Use the email address connected to your learner or admin access.</p>
          </div>
          <label>
            Email address
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" />
          </label>
          <Button
            type="button"
            className="w-full justify-center"
            onClick={async () => {
              await signIn("resend", { email, redirectTo: "/auth/complete" });
              setSent(true);
            }}
          >
            Send access link
          </Button>
        </>
      ) : null}
      {previewEnabled ? (
        <div className="space-y-3 border-t border-[var(--border)] pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">Preview access</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center"
              onClick={async () => {
                await signIn("preview-access", {
                  previewRole: "admin",
                  redirectTo: "/auth/complete",
                });
              }}
            >
              Enter admin preview
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center"
              onClick={async () => {
                await signIn("preview-access", {
                  previewRole: "student",
                  redirectTo: "/auth/complete",
                });
              }}
            >
              Enter student preview
            </Button>
          </div>
        </div>
      ) : null}
    </AuthEntryShell>
  );
}
