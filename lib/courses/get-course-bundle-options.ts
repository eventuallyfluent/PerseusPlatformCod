import { CourseStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryOffer } from "@/lib/offers/sync-product-offer";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import { currencyFormatter } from "@/lib/utils";

export type CourseBundleOption = {
  id: string;
  title: string;
  subtitle?: string | null;
  courseCount: number;
  priceLabel: string;
  bundleUrl: string;
};

export async function getCourseBundleOptions(courseId: string): Promise<CourseBundleOption[]> {
  const bundleCourses = await prisma.bundleCourse.findMany({
    where: {
      courseId,
      bundle: {
        status: CourseStatus.PUBLISHED,
      },
    },
    include: {
      bundle: {
        include: {
          courses: true,
          offers: {
            include: {
              prices: true,
            },
          },
        },
      },
    },
    orderBy: [
      {
        bundle: {
          updatedAt: "desc",
        },
      },
      {
        position: "asc",
      },
    ],
  });

  return bundleCourses.flatMap(({ bundle }) => {
      const offer = getPrimaryOffer(bundle.offers);

      if (!offer?.isPublished) {
        return [];
      }

      return [{
        id: bundle.id,
        title: bundle.title,
        subtitle: bundle.subtitle ?? bundle.shortDescription,
        courseCount: bundle.courses.length,
        priceLabel: currencyFormatter(bundle.price.toString(), bundle.currency),
        bundleUrl: resolveBundlePublicPath(bundle),
      }];
    });
}
