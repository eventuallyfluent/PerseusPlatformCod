import type { PropsWithChildren } from "react";
import { SiteHeader } from "@/components/public/site-header";

export default async function CheckoutLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,rgba(143,44,255,0.1),transparent_20%),linear-gradient(180deg,#0d0f1d,#13152a_34%,#0c0e1d_100%)]">
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
