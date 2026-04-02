import { prisma } from "@/lib/db/prisma";
import { offerInputSchema } from "@/lib/zod/schemas";

function buildCheckoutPath(ownerId: string, offerName: string) {
  return `/checkout/${ownerId}-${offerName.toLowerCase().replace(/\s+/g, "-")}`;
}

export async function upsertOffer(input: unknown, id?: string) {
  const data = offerInputSchema.parse(input);

  if (Boolean(data.courseId) === Boolean(data.bundleId)) {
    throw new Error("Offer must belong to exactly one owner");
  }

  const ownerId = data.courseId ?? data.bundleId;

  if (!ownerId) {
    throw new Error("Offer must belong to a course or bundle");
  }

  const payload = {
    courseId: data.courseId || null,
    bundleId: data.bundleId || null,
    name: data.name,
    type: data.type,
    price: data.price,
    currency: data.currency.toUpperCase(),
    compareAtPrice: data.compareAtPrice,
    isPublished: data.isPublished,
    checkoutPath: data.checkoutPath || buildCheckoutPath(ownerId, data.name),
  };

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
          isDefault: true,
        },
      },
    },
  });
}
