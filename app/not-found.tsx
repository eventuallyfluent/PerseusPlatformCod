import { PublicNotFoundContent } from "@/components/public/not-found-content";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <PublicNotFoundContent />
      </main>
      <SiteFooter />
    </div>
  );
}

