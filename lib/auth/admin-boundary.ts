import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function requireAdminRoute() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  if (!session.user.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  return null;
}
