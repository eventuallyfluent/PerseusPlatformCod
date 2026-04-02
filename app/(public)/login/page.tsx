"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthEntryShell } from "@/components/public/auth-entry-shell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <AuthEntryShell
      eyebrow="Magic link"
      title="Return to your study space without a password."
      description="Perseus keeps sign-in quiet: one email field, one link, and the same route for students and admins. Admin access is still restricted by allowlist."
      successMessage={sent ? "Check your email for the sign-in link." : null}
      aside={
        <>
          <Card className="space-y-3 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">How it works</p>
            <p className="text-sm leading-7 text-stone-600">Enter your email, open the link, and land directly in the learner dashboard.</p>
          </Card>
          <Card className="space-y-3 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Why this flow</p>
            <p className="text-sm leading-7 text-stone-600">The same low-friction access works for students, instructors, and admins without introducing password clutter.</p>
          </Card>
        </>
      }
    >
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-400">Sign in</p>
        <p className="text-sm leading-7 text-stone-600">Use the email address connected to your learner or admin account.</p>
      </div>
      <label>
        Email address
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" />
      </label>
      <Button
        type="button"
        onClick={async () => {
          await signIn("resend", { email, redirectTo: "/dashboard" });
          setSent(true);
        }}
      >
        Send magic link
      </Button>
    </AuthEntryShell>
  );
}
