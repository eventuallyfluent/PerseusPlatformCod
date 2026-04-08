import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type CouponOffer = Prisma.OfferGetPayload<{
  include: {
    course: {
      include: {
        collectionCourses: true;
      };
    };
    bundle: true;
  };
}>;

export async function resolveCoupon(code?: string | null, offer?: CouponOffer | null) {
  const normalizedCode = code?.trim().toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  if (!coupon.isActive) {
    throw new Error("Coupon is inactive");
  }

  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    throw new Error("Coupon has expired");
  }

  if (offer) {
    if (coupon.scope === "PRODUCT") {
      const matchesCourse = coupon.courseId && coupon.courseId === offer.course?.id;
      const matchesBundle = coupon.bundleId && coupon.bundleId === offer.bundle?.id;

      if (!matchesCourse && !matchesBundle) {
        throw new Error("Coupon does not apply to this product");
      }
    }

    if (coupon.scope === "COLLECTION") {
      const collectionIds = offer.course?.collectionCourses.map((item) => item.collectionId) ?? [];

      if (!coupon.collectionId || !collectionIds.includes(coupon.collectionId)) {
        throw new Error("Coupon does not apply to this collection");
      }
    }
  }

  return coupon;
}
