import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { SiteHeader } from "@/components/public/site-header";
import { buildNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildNoIndexMetadata({
  title: "Checkout",
  description: "Checkout and payment handling for Perseus Arcane Academy.",
});

export default async function CheckoutLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--shell-background-checkout)]">
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
