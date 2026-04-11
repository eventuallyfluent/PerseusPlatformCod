import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { normalizeAdminReturnPath, normalizeLearnerReturnPath } from "@/lib/auth/return-path";

export const dynamic = "force-dynamic";

export default async function AuthCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; audience?: string }>;
}) {
  const session = await requireSession();
  const query = await searchParams;
  const audience = query.audience === "admin" ? "admin" : "learner";

  if (audience === "admin") {
    if (!session.user.isAdmin) {
      redirect("/login?error=admin-only");
    }

    redirect(normalizeAdminReturnPath(query.returnTo, "/admin"));
  }

  redirect(normalizeLearnerReturnPath(query.returnTo, "/dashboard"));
}
