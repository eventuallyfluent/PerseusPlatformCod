"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AuthEntryShell } from "@/components/public/auth-entry-shell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <AuthEntryShell
      eyebrow="Returning students"
      title="Return to your study space."
      description="Access begins from a free or paid course. Once you have joined, this page is only for returning through a quiet magic-link flow."
      successMessage={sent ? "Check your email for the sign-in link." : null}
      aside={
        <>
          <Card className="space-y-3 p-5">
            <Badge variant="accent">How entry works</Badge>
            <p className="text-sm leading-7 text-[var(--foreground-soft)]">Join through a free course or complete paid checkout, then return here whenever you need to re-enter.</p>
          </Card>
          <Card className="space-y-3 p-5">
            <Badge variant="premium">No separate membership page</Badge>
            <p className="text-sm leading-7 text-[var(--foreground-soft)]">Perseus creates access as part of enrollment, not through a generic register screen that sits outside the course flow.</p>
          </Card>
        </>
      }
    >
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
          await signIn("resend", { email, redirectTo: "/dashboard" });
          setSent(true);
        }}
      >
        Send access link
      </Button>
    </AuthEntryShell>
  );
}
