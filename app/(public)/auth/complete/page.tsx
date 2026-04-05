import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AuthCompletePage() {
  const session = await requireSession();

  if (session.user.isAdmin) {
    redirect("/admin");
  }

  redirect("/dashboard");
}
