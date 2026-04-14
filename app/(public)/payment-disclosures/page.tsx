import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";
import { LEGAL_COMPANY } from "@/lib/legal/company";

export const metadata: Metadata = {
  title: "Payment Disclosures",
  description: `Payment, billing, and merchant disclosures for ${LEGAL_COMPANY.dbaName}.`,
};

export default function PaymentDisclosuresPage() {
  return (
    <LegalPage
      eyebrow="Payment Disclosures"
      title="Merchant, billing, and payment disclosures"
      summary={`This page explains who sells the products on this site, how fulfillment works, and what customers should expect when they pay through ${LEGAL_COMPANY.dbaName}.`}
      sections={[
        {
          title: "Merchant identity",
          body: [
            `${LEGAL_COMPANY.legalName} is the legal business entity responsible for sales on this site. ${LEGAL_COMPANY.dbaName} is a trade name / DBA used publicly for the academy and its educational offers.`,
            ...(LEGAL_COMPANY.businessAddressLines.length > 0
              ? [`Business mailing address: ${LEGAL_COMPANY.businessAddressLines.join(", ")}.`]
              : []),
          ],
        },
        {
          title: "Payment processing",
          body: [
            "Payments may be handled by one or more third-party payment providers or banks depending on the checkout path used for the transaction. The payment processor may collect and verify transaction, billing, tax, and fraud-prevention information needed to complete the payment.",
            "For manually reviewed or bank-transfer payment methods, access is not issued until the payment is confirmed.",
          ],
        },
        {
          title: "Pricing, taxes, and promotions",
          body: [
            "Displayed prices and discounts are shown at checkout for the selected product. Taxes, where applicable, may depend on the active gateway, payment provider, and business compliance setup in effect for the transaction.",
            "Promotional terms, coupon scope, and bundle inclusions are governed by what is shown on the applicable sales and checkout pages at the time of purchase.",
          ],
        },
        {
          title: "Support and disputes",
          body: [
            `Customers should contact ${LEGAL_COMPANY.supportEmail} before filing payment disputes where possible. This is the fastest path for duplicate charges, missing access, or payment-status questions.`,
          ],
        },
      ]}
    />
  );
}
