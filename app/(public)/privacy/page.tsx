import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";
import { LEGAL_COMPANY } from "@/lib/legal/company";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy practices for ${LEGAL_COMPANY.dbaName}, a DBA of ${LEGAL_COMPANY.legalName}.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy Policy"
      title={`Privacy at ${LEGAL_COMPANY.dbaName}`}
      summary={`${LEGAL_COMPANY.legalName}, doing business as ${LEGAL_COMPANY.dbaName}, explains here how customer, student, and visitor data is collected, used, and protected on this site.`}
      sections={[
        {
          title: "Who is collecting your data",
          body: [
            `${LEGAL_COMPANY.legalName} is the legal business entity operating ${LEGAL_COMPANY.dbaName}. When you visit the site, create an account, purchase a course or bundle, join a waitlist, or contact support, your information is collected by or on behalf of ${LEGAL_COMPANY.legalName}.`,
            `This policy applies to the public site, checkout flows, student dashboard, course access pages, and support interactions connected to ${LEGAL_COMPANY.dbaName}.`,
          ],
        },
        {
          title: "What we collect",
          body: [
            "We may collect your name, email address, payment-related transaction details, purchase history, enrolled products, account activity, lesson progress, support messages, device/browser information, IP address, and basic analytics or security logs.",
            "Payment card and bank information is handled by the payment provider used for the transaction and is not stored in full by the Perseus application itself.",
          ],
        },
        {
          title: "How we use information",
          body: [
            "We use information to deliver course access, process transactions, provide customer support, authenticate logins, prevent fraud, send transactional messages, improve site performance, enforce platform terms, and comply with legal or payment-provider obligations.",
            "If you voluntarily subscribe to updates, we may also use your email address for course release announcements, academy news, and related marketing until you unsubscribe.",
          ],
        },
        {
          title: "How information is shared",
          body: [
            "We share information only where needed to operate the academy, including with payment processors, infrastructure providers, analytics/security vendors, email delivery providers, and professional advisers when reasonably necessary.",
            "We may also disclose information to respond to lawful requests, protect the business from fraud or abuse, resolve disputes, or enforce agreements connected to purchases and platform use.",
          ],
        },
        {
          title: "Data retention and security",
          body: [
            "We retain information for as long as it is reasonably necessary for account access, transaction records, support history, tax/accounting needs, dispute resolution, and compliance with legal obligations.",
            "The business uses commercially reasonable technical and organizational safeguards, but no internet or cloud system can be guaranteed to be completely secure.",
          ],
        },
        {
          title: "Your privacy choices",
          body: [
            "You may request access, correction, or deletion of your personal information where applicable law gives you those rights, subject to our need to retain transaction and compliance records.",
            `Privacy and data requests can be sent to ${LEGAL_COMPANY.legalEmail}.`,
          ],
        },
      ]}
    />
  );
}
