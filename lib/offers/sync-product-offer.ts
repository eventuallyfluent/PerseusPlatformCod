import { CourseStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { findAccessProductIdForOwner } from "@/lib/access-products/sync-access-product";

function buildDefaultOfferName(title: string) {
  return `${title} access`;
}

type SyncProductOfferInput = {
  courseId?: string | null;
  bundleId?: string | null;
  title: string;
  price: number | string;
  currency: string;
  compareAtPrice?: number | string | null;
  status: CourseStatus;
};

export async function syncProductOffer(input: SyncProductOfferInput) {
  const courseId = input.courseId ?? null;
  const bundleId = input.bundleId ?? null;

  if (Boolean(courseId) === Boolean(bundleId)) {
    throw new Error("A synced product offer must belong to exactly one product.");
  }

  const accessProductId = await findAccessProductIdForOwner({ courseId, bundleId });
  const whereClause = accessProductId
    ? {
        OR: [
          {
            courseId: courseId ?? undefined,
            bundleId: bundleId ?? undefined,
          },
          {
            accessProductId,
          },
        ],
      }
    : {
        courseId: courseId ?? undefined,
        bundleId: bundleId ?? undefined,
      };

  const existing =
    (await prisma.offer.findFirst({
      where: whereClause,
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
      select: { id: true },
    })) ?? null;

  const data = {
    courseId,
    bundleId,
    accessProductId,
    name: buildDefaultOfferName(input.title),
    type: "ONE_TIME" as const,
    price: Number(input.price),
    currency: input.currency.toUpperCase(),
    compareAtPrice: input.compareAtPrice === null || input.compareAtPrice === undefined || input.compareAtPrice === ""
      ? null
      : Number(input.compareAtPrice),
    isPublished: input.status === CourseStatus.PUBLISHED,
    isDefault: true,
  };

  if (existing) {
    return prisma.offer.update({
      where: { id: existing.id },
      data: {
        ...data,
        prices: {
          deleteMany: {},
          create: {
            amount: Number(input.price),
            currency: input.currency.toUpperCase(),
            isDefault: true,
          },
        },
      },
    });
  }

  return prisma.offer.create({
    data: {
      ...data,
      prices: {
        create: {
          amount: Number(input.price),
          currency: input.currency.toUpperCase(),
          isDefault: true,
        },
      },
    },
  });
}

export function getPrimaryOffer<T extends { isDefault: boolean; isPublished: boolean }>(offers: T[]) {
  return offers.find((offer) => offer.isDefault) ?? offers.find((offer) => offer.isPublished) ?? offers[0] ?? null;
}
