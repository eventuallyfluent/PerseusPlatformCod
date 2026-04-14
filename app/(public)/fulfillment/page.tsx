import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";
import { LEGAL_COMPANY } from "@/lib/legal/company";

export const metadata: Metadata = {
  title: "Fulfillment Policy",
  description: `Digital delivery and access fulfillment policy for ${LEGAL_COMPANY.dbaName}.`,
};

export default function FulfillmentPage() {
  return (
    <LegalPage
      eyebrow="Fulfillment Policy"
      title="How digital access is delivered"
      summary={`${LEGAL_COMPANY.dbaName} delivers courses and bundles digitally. This page explains when access is provided and what happens if a payment is delayed or reviewed.`}
      sections={[
        {
          title: "Delivery timing",
          body: [
            "For successful real-time card or provider-hosted checkout payments, access is generally issued shortly after payment confirmation.",
            "For bank-transfer or manually reviewed payments, access is delivered only after the payment is verified and marked paid by the business.",
          ],
        },
        {
          title: "What you receive",
          body: [
            "A course purchase unlocks the purchased course. A bundle purchase unlocks the courses listed as included on the bundle sales page for that offer.",
            "If a product uses drip release or preview lessons, those access rules apply after enrollment in the normal student experience.",
          ],
        },
        {
          title: "Access issues",
          body: [
            `If you completed checkout but do not receive the expected student access, contact ${LEGAL_COMPANY.supportEmail} with the email used during purchase and any receipt or order reference you received.`,
          ],
        },
      ]}
    />
  );
}
