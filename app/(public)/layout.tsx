import type { PropsWithChildren } from "react";
import { SiteHeader } from "@/components/public/site-header";

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>{children}</main>
    </div>
  );
}
