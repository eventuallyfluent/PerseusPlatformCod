import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireSession() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  return session;
}

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  if (!session.user.isAdmin) {
    redirect("/dashboard");
  }

  return session;
}
