"use server";

import { ContactInquiryStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

function getReturnPath(formData: FormData) {
  const raw = String(formData.get("returnPath") ?? "/admin/inquiries").trim();
  return raw.startsWith("/admin") && !raw.startsWith("//") ? raw : "/admin/inquiries";
}

function withStatusParam(path: string, key: "saved" | "error") {
  return `${path}${path.includes("?") ? "&" : "?"}${key}=inquiry`;
}

export async function updateInquiryStatusAction(formData: FormData) {
  await requireAdmin();
  const inquiryId = String(formData.get("inquiryId") ?? "");
  const status = String(formData.get("status") ?? "");
  const returnPath = getReturnPath(formData);

  if (!inquiryId || !["UNREAD", "READ", "ARCHIVED"].includes(status)) {
    redirect(withStatusParam(returnPath, "error"));
  }

  await prisma.contactInquiry.update({
    where: { id: inquiryId },
    data: { status: status as ContactInquiryStatus },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/inquiries");
  redirect(withStatusParam(returnPath, "saved"));
}
