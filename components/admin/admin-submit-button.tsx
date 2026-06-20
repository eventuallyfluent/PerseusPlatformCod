"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type AdminSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel?: string;
};

function PendingLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2" aria-live="polite">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </span>
  );
}

export function AdminSubmitButton({
  children,
  className,
  disabled,
  pendingLabel = "Saving...",
  type = "submit",
  ...props
}: AdminSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      className={cn(className, "disabled:cursor-wait disabled:opacity-70")}
      disabled={disabled || pending}
      type={type}
    >
      {pending ? <PendingLabel label={pendingLabel} /> : children}
    </button>
  );
}

type AdminExternalSubmitButtonProps = Omit<AdminSubmitButtonProps, "form" | "type"> & {
  formId: string;
};

export function AdminExternalSubmitButton({
  children,
  className,
  disabled,
  formId,
  pendingLabel = "Saving...",
  ...props
}: AdminExternalSubmitButtonProps) {
  const [pending, setPending] = useState(false);

  function submitForm() {
    const form = document.getElementById(formId);

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setPending(true);
    form.requestSubmit();
  }

  return (
    <button
      {...props}
      className={cn(className, "disabled:cursor-wait disabled:opacity-70")}
      disabled={disabled || pending}
      onClick={submitForm}
      type="button"
    >
      {pending ? <PendingLabel label={pendingLabel} /> : children}
    </button>
  );
}
