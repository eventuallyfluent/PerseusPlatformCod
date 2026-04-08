import { prisma } from "@/lib/db/prisma";

export async function getOfferById(id: string) {
  return prisma.offer.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          instructor: true,
          collectionCourses: true,
          upsellCourse: {
            include: {
              instructor: true,
              offers: {
                include: {
                  prices: true,
                },
              },
            },
          },
          upsellBundle: {
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
              offers: {
                include: {
                  prices: true,
                },
              },
            },
          },
        },
      },
      bundle: {
        include: {
          upsellCourse: {
            include: {
              instructor: true,
              offers: {
                include: {
                  prices: true,
                },
              },
            },
          },
          upsellBundle: {
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
              offers: {
                include: {
                  prices: true,
                },
              },
            },
          },
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
