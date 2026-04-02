import { prisma } from "@/lib/db/prisma";

export async function getOfferById(id: string) {
  return prisma.offer.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          instructor: true,
        },
      },
      bundle: {
        include: {
          courses: {
            include: {
              course: {
                include: {
                  instructor: true,
                },
              },
            },
            orderBy: { position: "asc" },
          },
        },
      },
      prices: true,
    },
  });
}
