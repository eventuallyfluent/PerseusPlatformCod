import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { normalizeReturnPath } from "@/lib/auth/return-path";

export const dynamic = "force-dynamic";

export default async function AuthCompletePage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const session = await requireSession();
  const query = await searchParams;
  const returnTo = normalizeReturnPath(query.returnTo, session.user.isAdmin ? "/admin" : "/dashboard");

  if (!session.user.isAdmin && query.returnTo) {
    redirect(returnTo);
  }

  if (session.user.isAdmin && query.returnTo && returnTo !== "/dashboard") {
    redirect(returnTo);
  }

  redirect(session.user.isAdmin ? "/admin" : "/dashboard");
}
