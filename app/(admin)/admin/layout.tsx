import type { PropsWithChildren } from "react";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({ children }: PropsWithChildren) {
  await requireAdmin();
  return children;
}
