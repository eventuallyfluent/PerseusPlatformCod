"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CouponScope } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

function parseBooleanField(formData: FormData, name: string, defaultValue = false) {
  const value = formData.get(name);

  if (value === null || value === undefined) {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  return ["true", "1", "yes", "y", "on"].includes(normalized);
}

export async function saveCouponAction(formData: FormData) {
  await requireAdmin();
  const couponId = String(formData.get("couponId") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const scope = String(formData.get("scope") ?? "TOTAL_ORDER").trim();
  const productTarget = String(formData.get("productTarget") ?? "").trim();
  const collectionId = String(formData.get("collectionId") ?? "").trim();
  const discountType = String(formData.get("discountType") ?? "").trim();
  const amountOffRaw = String(formData.get("amountOff") ?? "").trim();
  const percentOffRaw = String(formData.get("percentOff") ?? "").trim();
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();
  const redirectBase = `/admin/coupons${couponId ? "?saved=updated" : "?saved=created"}`;

  if (!code) redirect("/admin/coupons?error=code");
  if (!["TOTAL_ORDER", "PRODUCT", "COLLECTION"].includes(scope)) redirect("/admin/coupons?error=scope");
  if (discountType !== "amount" && discountType !== "percent") redirect("/admin/coupons?error=discountType");

  const amountOff = amountOffRaw ? Number(amountOffRaw) : null;
  const percentOff = percentOffRaw ? Number(percentOffRaw) : null;

  if (discountType === "amount" && (!amountOff || amountOff <= 0)) redirect("/admin/coupons?error=amount");
  if (discountType === "percent" && (!percentOff || percentOff < 1 || percentOff > 100)) redirect("/admin/coupons?error=percent");

  let courseId: string | null = null;
  let bundleId: string | null = null;

  if (scope === "PRODUCT") {
    const [kind, id] = productTarget.split(":");

    if (!id || (kind !== "course" && kind !== "bundle")) redirect("/admin/coupons?error=product");

    courseId = kind === "course" ? id : null;
    bundleId = kind === "bundle" ? id : null;
  }

  if (scope === "COLLECTION" && !collectionId) redirect("/admin/coupons?error=collection");

  const payload = {
    code,
    scope: scope as CouponScope,
    courseId,
    bundleId,
    collectionId: scope === "COLLECTION" ? collectionId : null,
    amountOff: discountType === "amount" ? amountOff : null,
    percentOff: discountType === "percent" ? percentOff : null,
    isActive: parseBooleanField(formData, "isActive"),
    expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
  };

  try {
    if (couponId) {
      await prisma.coupon.update({ where: { id: couponId }, data: payload });
    } else {
      await prisma.coupon.create({ data: payload });
    }
  } catch {
    redirect("/admin/coupons?error=save");
  }

  revalidatePath("/admin/coupons");
  redirect(redirectBase);
}

export async function deleteCouponAction(formData: FormData) {
  await requireAdmin();
  const couponId = String(formData.get("couponId") ?? "");

  try {
    await prisma.coupon.delete({ where: { id: couponId } });
  } catch {
    redirect("/admin/coupons?error=delete");
  }

  revalidatePath("/admin/coupons");
  redirect("/admin/coupons?saved=deleted");
}
