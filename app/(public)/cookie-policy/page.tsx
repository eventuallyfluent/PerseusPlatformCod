import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";
import { LEGAL_COMPANY } from "@/lib/legal/company";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `Cookie and similar technology disclosures for ${LEGAL_COMPANY.dbaName}.`,
};

export default function CookiePolicyPage() {
  return (
    <LegalPage
      eyebrow="Cookie Policy"
      title="Cookies and similar technologies"
      summary={`${LEGAL_COMPANY.dbaName} may use cookies and similar technologies for login continuity, security, performance, and analytics.`}
      sections={[
        {
          title: "What cookies are used for",
          body: [
            "Cookies and similar tools may be used to keep you signed in, protect the platform from fraud or abuse, remember preferences, measure site performance, and support payment or session continuity.",
          ],
        },
        {
          title: "Third-party tools",
          body: [
            "Some cookies or local browser storage may come from payment, analytics, infrastructure, or embedded-media providers used to operate the site.",
          ],
        },
        {
          title: "Your choices",
          body: [
            "Most browsers let you block or delete cookies. Some parts of the site, including login and checkout-related behavior, may not function correctly if essential cookies are disabled.",
          ],
        },
      ]}
    />
  );
}
