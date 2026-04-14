import type { Metadata } from "next";
import { LegalPage } from "@/components/public/legal-page";
import { LEGAL_COMPANY } from "@/lib/legal/company";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms governing purchases and use of ${LEGAL_COMPANY.dbaName}.`,
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms of Service"
      title="Terms for site access, purchases, and student use"
      summary={`${LEGAL_COMPANY.legalName}, doing business as ${LEGAL_COMPANY.dbaName}, provides this site and its educational products subject to these terms.`}
      sections={[
        {
          title: "Use of the site",
          body: [
            "By visiting the site, creating an account, or purchasing a product, you agree to use the platform lawfully and only for personal or authorized business use connected to your purchase.",
            "You may not attempt to interfere with the site, bypass access rules, resell access that was not licensed for resale, share protected student content outside permitted use, or use the platform in a fraudulent or abusive way.",
          ],
        },
        {
          title: "Product access and fulfillment",
          body: [
            "Courses and bundles are digital educational products. Access is generally provided after successful payment confirmation. If a payment method is under review, delayed, or bank-transfer based, access begins only after the payment is confirmed.",
            "A bundle purchase grants access to the included courses identified on the bundle sales page at the time of purchase unless a different written offer expressly states otherwise.",
          ],
        },
        {
          title: "Pricing and promotions",
          body: [
            "Prices, included materials, promotions, coupons, and bonuses may change over time. The price and offer displayed at checkout is the governing offer for that transaction.",
            "If a promotion or discount is offered, any conditions, expiration dates, eligibility rules, and product scope apply as displayed on the sales or checkout page.",
          ],
        },
        {
          title: "Refunds and disputes",
          body: [
            "Refund treatment is governed by the published Refund Policy. Customers should contact support before initiating disputes or chargebacks so that access, duplicate charges, or payment issues can be reviewed directly.",
            "If a chargeback or payment reversal occurs, the business may suspend access to the affected product while the dispute is being investigated.",
          ],
        },
        {
          title: "Intellectual property",
          body: [
            `All course content, text, lessons, videos, downloads, branding, and platform materials made available through ${LEGAL_COMPANY.dbaName} remain the property of ${LEGAL_COMPANY.legalName} or its licensors unless otherwise stated.`,
            "Purchasing a course gives you a limited, non-transferable right to access the product for your own permitted use. It does not transfer ownership of the content or permit redistribution, copying, rebroadcasting, or sublicensing.",
          ],
        },
        {
          title: "Contact",
          body: [
            `Customer-service and legal notices should be sent to ${LEGAL_COMPANY.legalEmail}.`,
          ],
        },
      ]}
    />
  );
}
