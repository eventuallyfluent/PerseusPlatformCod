"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AuthEntryShell } from "@/components/public/auth-entry-shell";
import { HardLink } from "@/components/ui/hard-link";

export function LoginForm({
  previewEnabled,
  emailEnabled,
  redirectTo,
  intent = "student",
  mode = "student",
  errorMessage,
  adminPasswordConfigured = true,
}: {
  previewEnabled: boolean;
  emailEnabled: boolean;
  redirectTo: string;
  intent?: "student" | "free-preview";
  mode?: "student" | "admin";
  errorMessage?: string | null;
  adminPasswordConfigured?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const isAdmin = mode === "admin";
  const isFreePreview = !isAdmin && intent === "free-preview";

  return (
    <AuthEntryShell
      eyebrow={isAdmin ? "Admin access" : isFreePreview ? "Course preview" : "Student account"}
      title={isAdmin ? "Open the admin workspace." : isFreePreview ? "Enter the preview." : "Enter your study space."}
      description={
        isAdmin
          ? "Use your approved admin email and password to enter the backend."
          : isFreePreview
            ? "Watch free preview lessons with the same Perseus account that keeps your courses, purchases, and library in one place."
            : "One Perseus account gives you access to previews, free courses, purchases, and your course library."
      }
      successMessage={sent ? "Check your email for the sign-in link." : null}
    >
      {errorMessage || adminError ? (
        <p className="rounded-[20px] bg-[rgba(183,28,28,0.08)] px-4 py-3 text-sm font-medium text-[#b42318]">{errorMessage ?? adminError}</p>
      ) : !isAdmin ? (
        <div className="space-y-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-4">
          <p className="text-sm font-medium text-[var(--foreground)]">Access links are temporarily unavailable.</p>
          <p className="text-sm leading-7 text-[var(--foreground-soft)]">
            We cannot send student access links right now. Contact us and we will help you reach your course or preview.
          </p>
          <HardLink href="/contact" className="inline-flex text-sm font-medium text-[var(--accent)] underline underline-offset-4">
            Contact support
          </HardLink>
        </div>
      ) : null}
      {isAdmin ? (
        <>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">Admin sign in</p>
            <p className="text-sm leading-7 text-[var(--foreground-soft)]">
              {adminPasswordConfigured
                ? "Use your approved admin email and the current backend password. A bootstrap admin login also exists for initial access."
                : "Backend sign-in is disabled until ADMIN_LOGIN_PASSWORD is configured."}
            </p>
          </div>
          <label>
            Email address
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" />
          </label>
          <Button
            type="button"
            className="w-full justify-center"
            disabled={!adminPasswordConfigured}
            onClick={async () => {
              setAdminError(null);
              const result = await signIn("admin-credentials", {
                email,
                password,
                redirect: false,
                redirectTo,
              });

              if (result?.error) {
                setAdminError("Invalid admin email or password.");
                return;
              }

              router.push(result?.url ?? redirectTo);
              router.refresh();
            }}
          >
            Sign in to admin
          </Button>
        </>
      ) : emailEnabled ? (
        <>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">Sign in</p>
            <p className="text-sm leading-7 text-[var(--foreground-soft)]">
              {isFreePreview
                ? "Your student account also keeps any free courses or purchases you add later."
                : isAdmin
                  ? "Only approved admin accounts can enter the backend from this page."
                  : "Enter your email and we will send a private access link."}
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
          {isFreePreview ? (
            <p className="text-xs leading-6 text-[var(--foreground-soft)]">
              Preview access includes course updates from Perseus. You can unsubscribe later.
            </p>
          ) : null}
        </>
      ) : null}
      {previewEnabled && isAdmin ? (
        <div className="space-y-3 border-t border-[var(--border)] pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">Preview access</p>
          <div className={`grid gap-3 ${isAdmin ? "" : "sm:grid-cols-2"}`}>
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
          </div>
        </div>
      ) : null}
    </AuthEntryShell>
  );
}
