"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AuthEntryShell } from "@/components/public/auth-entry-shell";

export function LoginForm({
  previewEnabled,
  emailEnabled,
  redirectTo,
  mode = "student",
  errorMessage,
}: {
  previewEnabled: boolean;
  emailEnabled: boolean;
  redirectTo: string;
  mode?: "student" | "admin";
  errorMessage?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const isAdmin = mode === "admin";

  return (
    <AuthEntryShell
      eyebrow={isAdmin ? "Admin access" : "Returning students"}
      title={isAdmin ? "Open the admin workspace." : "Return to your study space."}
      description={
        isAdmin
          ? "Use an approved admin email and we will send you a sign-in link for the backend."
          : "Use the email connected to your course access and we will send you a sign-in link."
      }
      successMessage={sent ? "Check your email for the sign-in link." : null}
    >
      {errorMessage ? (
        <p className="rounded-[20px] bg-[rgba(183,28,28,0.08)] px-4 py-3 text-sm font-medium text-[#b42318]">{errorMessage}</p>
      ) : null}
      {emailEnabled ? (
        <>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">Sign in</p>
            <p className="text-sm leading-7 text-[var(--foreground-soft)]">
              {isAdmin
                ? "Only approved admin accounts can enter the backend from this page."
                : "Use the email address connected to your student access."}
            </p>
          </div>
          <label>
            Email address
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" />
          </label>
          <Button
            type="button"
            className="w-full justify-center"
            onClick={async () => {
              await signIn("resend", { email, redirectTo });
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
          <div className={`grid gap-3 ${isAdmin ? "" : "sm:grid-cols-2"}`}>
            {isAdmin ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-center"
                onClick={async () => {
                  await signIn("preview-access", {
                    previewRole: "admin",
                    redirectTo,
                  });
                }}
              >
                Enter admin preview
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-center"
                onClick={async () => {
                  await signIn("preview-access", {
                    previewRole: "student",
                    redirectTo,
                  });
                }}
              >
                Enter student preview
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </AuthEntryShell>
  );
}
