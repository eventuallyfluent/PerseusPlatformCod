"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthEntryShell } from "@/components/public/auth-entry-shell";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <AuthEntryShell
      eyebrow="Registration"
      title="Create access the same way you return."
      description="New learners enter through the same magic-link flow as sign-in, so the first step into Perseus feels identical to the next one."
      successMessage={sent ? "Check your email for the access link." : null}
      aside={
        <>
          <Card className="space-y-3 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">No passwords</p>
            <p className="text-sm leading-7 text-stone-600">Account access starts with one email and a direct link back into the platform.</p>
          </Card>
          <Card className="space-y-3 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">After entry</p>
            <p className="text-sm leading-7 text-stone-600">Once enrolled, the dashboard becomes the default orientation point for every course and bundle unlock.</p>
          </Card>
        </>
      }
    >
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-400">Create access</p>
        <p className="text-sm leading-7 text-stone-600">Use the email address you want tied to your learner record.</p>
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
        Send access link
      </Button>
    </AuthEntryShell>
  );
}
