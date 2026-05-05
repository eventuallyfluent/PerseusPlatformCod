import { prisma } from "@/lib/db/prisma";
import { offerInputSchema } from "@/lib/zod/schemas";
import { findAccessProductIdForOwner } from "@/lib/access-products/sync-access-product";

function buildCheckoutPath(ownerId: string, offerName: string) {
  return `/checkout/${ownerId}-${offerName.toLowerCase().replace(/\s+/g, "-")}`;
}

export async function upsertOffer(input: unknown, id?: string) {
  const data = offerInputSchema.parse(input);

  if (Boolean(data.courseId) === Boolean(data.bundleId)) {
    throw new Error("Offer must belong to exactly one owner");
  }

  const ownerId = data.courseId ?? data.bundleId;
  const accessProductId = await findAccessProductIdForOwner({ courseId: data.courseId, bundleId: data.bundleId });

  if (!ownerId) {
    throw new Error("Offer must belong to a course or bundle");
  }

  const payload = {
    courseId: data.courseId || null,
    bundleId: data.bundleId || null,
    accessProductId,
    name: data.name,
    type: data.type,
    price: data.price,
    currency: data.currency.toUpperCase(),
    compareAtPrice: data.compareAtPrice,
    isPublished: data.isPublished,
    isDefault: data.isDefault,
    checkoutPath: data.checkoutPath || buildCheckoutPath(ownerId, data.name),
  };

  if (data.isDefault) {
    await prisma.offer.updateMany({
      where: data.courseId ? { courseId: data.courseId } : { bundleId: data.bundleId },
      data: { isDefault: false },
    });
  }

  if (id) {
    return prisma.offer.update({
      where: { id },
      data: {
        ...payload,
        prices: {
          deleteMany: {},
          create: {
            amount: data.price,
            currency: data.currency.toUpperCase(),
            billingInterval: data.type === "SUBSCRIPTION" ? data.billingInterval ?? "month" : null,
            billingCount: data.type === "SUBSCRIPTION" ? 1 : null,
            isDefault: true,
          },
        },
      },
    });
  }

  return prisma.offer.create({
    data: {
      ...payload,
      prices: {
        create: {
          amount: data.price,
          currency: data.currency.toUpperCase(),
          billingInterval: data.type === "SUBSCRIPTION" ? data.billingInterval ?? "month" : null,
          billingCount: data.type === "SUBSCRIPTION" ? 1 : null,
          isDefault: true,
        },
      },
    },
  });
}
