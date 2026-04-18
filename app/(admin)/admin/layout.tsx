import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { requireAdmin } from "@/lib/auth/guards";
import { buildNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildNoIndexMetadata({
  title: "Admin",
  description: "Backend administration for Perseus Arcane Academy.",
  path: "/admin",
});

export default async function AdminLayout({ children }: PropsWithChildren) {
  await requireAdmin();
  return <div className="admin-theme theme-admin-clean">{children}</div>;
}
