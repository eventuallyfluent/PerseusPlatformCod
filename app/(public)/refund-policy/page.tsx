import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";
import { LEGAL_COMPANY } from "@/lib/legal/company";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: `Refund and chargeback policy for ${LEGAL_COMPANY.dbaName}.`,
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="Refund Policy"
      title="Refunds, duplicate charges, and payment issues"
      summary={`${LEGAL_COMPANY.dbaName} sells digital educational products. This page explains how refund requests, duplicate charges, and payment disputes are handled.`}
      sections={[
        {
          title: "Digital product policy",
          body: [
            "Because courses and bundles are delivered digitally and access can begin immediately after payment, all sales should be treated as final unless a specific offer states a different refund window or applicable law requires otherwise.",
            "If a checkout page, sales page, or written offer includes a more specific refund promise, that more specific promise controls for that purchase.",
          ],
        },
        {
          title: "When to contact support",
          body: [
            "Contact support promptly if you believe you were charged in error, purchased the same offer more than once, did not receive the access promised after a successful payment, or believe there was a technical problem during checkout.",
            `Refund and billing questions should be sent to ${LEGAL_COMPANY.supportEmail}.`,
          ],
        },
        {
          title: "How approved refunds are processed",
          body: [
            "If a refund is approved, it is submitted back to the original payment method used at checkout. Timing after submission depends on the payment provider and the customer’s bank or card issuer.",
            "If access was granted for the refunded purchase, that access may be removed once the refund is processed.",
          ],
        },
        {
          title: "Chargebacks and reversals",
          body: [
            "Customers are expected to contact support first before filing a chargeback where possible. This usually resolves access or billing errors faster and with less disruption.",
            "If a transaction is reversed, disputed, or charged back, associated access may be suspended while the matter is investigated.",
          ],
        },
      ]}
    />
  );
}
