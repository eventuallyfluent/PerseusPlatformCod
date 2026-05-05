import { CourseStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
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
      const offer = [...bundle.offers]
        .filter((item) => item.isPublished)
        .sort((left, right) => Number(right.isDefault) - Number(left.isDefault) || Number(left.price) - Number(right.price) || left.name.localeCompare(right.name))[0];

      if (!offer) {
        return [];
      }

      const price = offer.prices.find((item) => item.isDefault) ?? offer.prices[0] ?? null;
      const amount = price?.amount ?? offer.price;
      const currency = price?.currency ?? offer.currency;

      return [{
        id: bundle.id,
        title: bundle.title,
        subtitle: bundle.subtitle ?? bundle.shortDescription,
        courseCount: bundle.courses.length,
        priceLabel: currencyFormatter(amount.toString(), currency),
        bundleUrl: resolveBundlePublicPath(bundle),
      }];
    });
}
