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
          title: "Right to withdraw",
          body: [
            "Where applicable law provides a right to withdraw from an online contract, you may use the Withdraw from a contract function linked throughout this site. The function provides a review step, a separate confirmation step, and a timestamped acknowledgement.",
            "For eligible EU distance contracts, the statutory withdrawal period is generally 14 days. The online function does not reduce a longer refund promise or another remedy available under applicable law.",
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
            "Access linked only to a withdrawn order is removed when the withdrawal is confirmed. Existing access supported by another active purchase or grant is preserved.",
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
