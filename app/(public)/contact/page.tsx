import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";
import { LEGAL_COMPANY } from "@/lib/legal/company";

export const metadata: Metadata = {
  title: "Contact",
  description: `Customer-service and legal contact details for ${LEGAL_COMPANY.dbaName}.`,
};

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Contact"
      title="Customer service and legal contact"
      summary={`${LEGAL_COMPANY.legalName}, doing business as ${LEGAL_COMPANY.dbaName}, handles customer support and legal notices through the contact details below.`}
      sections={[
        {
          title: "Business identity",
          body: [
            `Legal company: ${LEGAL_COMPANY.legalName}.`,
            `Doing business as: ${LEGAL_COMPANY.dbaName}.`,
          ],
        },
        {
          title: "Support",
          body: [
            `Email: ${LEGAL_COMPANY.supportEmail}.`,
            `Support hours: ${LEGAL_COMPANY.supportHours}.`,
            ...(LEGAL_COMPANY.businessAddressLines.length > 0
              ? [`Business mailing address: ${LEGAL_COMPANY.businessAddressLines.join(", ")}.`]
              : []),
          ],
        },
        {
          title: "What to include",
          body: [
            "For billing or access help, include the email used for purchase, the product purchased, the order reference if available, and a short description of the issue.",
          ],
        },
      ]}
    />
  );
}
