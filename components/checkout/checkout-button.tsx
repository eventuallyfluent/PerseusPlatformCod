"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CheckoutButton({ offerId }: { offerId: string }) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const response = await fetch("/api/checkout/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ offerId }),
          });

          const data = await response.json();
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          }
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Redirecting..." : "Continue to payment"}
    </Button>
  );
}
