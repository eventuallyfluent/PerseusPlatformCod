import { AccessProductType, CourseStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

type SyncAccessProductInput =
  | {
      courseId: string;
      bundleId?: never;
      slug: string;
      title: string;
      status: CourseStatus;
      description?: string | null;
      grantedCourseIds?: string[];
    }
  | {
      bundleId: string;
      courseId?: never;
      slug: string;
      title: string;
      status: CourseStatus;
      description?: string | null;
      grantedCourseIds?: string[];
    };

export async function syncAccessProduct(input: SyncAccessProductInput) {
  const existing = await prisma.accessProduct.findFirst({
    where: input.courseId ? { courseId: input.courseId } : { bundleId: input.bundleId },
    select: { id: true },
  });

  const grantedCourseIds = [...new Set(input.grantedCourseIds ?? (input.courseId ? [input.courseId] : []))];
  const baseData = {
    slug: normalizeSlug(input.slug),
    title: input.title,
    description: input.description?.trim() ? input.description : null,
    status: input.status,
    type: input.courseId ? AccessProductType.COURSE_ACCESS : AccessProductType.BUNDLE_ACCESS,
    courseId: input.courseId ?? null,
    bundleId: input.bundleId ?? null,
    checkoutMode: "managed_checkout",
  };

  if (existing) {
    return prisma.accessProduct.update({
      where: { id: existing.id },
      data: {
        ...baseData,
        grants: {
          deleteMany: {},
          create: grantedCourseIds.map((courseId, index) => ({
            courseId,
            position: index + 1,
          })),
        },
      },
      include: {
        grants: {
          include: {
            course: true,
          },
          orderBy: { position: "asc" },
        },
      },
    });
  }

  return prisma.accessProduct.create({
    data: {
      ...baseData,
      grants: {
        create: grantedCourseIds.map((courseId, index) => ({
          courseId,
          position: index + 1,
        })),
      },
    },
    include: {
      grants: {
        include: {
          course: true,
        },
        orderBy: { position: "asc" },
      },
    },
  });
}

export async function findAccessProductIdForOwner(input: { courseId?: string | null; bundleId?: string | null }) {
  if (Boolean(input.courseId) === Boolean(input.bundleId)) {
    return null;
  }

  const product = await prisma.accessProduct.findFirst({
    where: input.courseId ? { courseId: input.courseId } : { bundleId: input.bundleId ?? undefined },
    select: { id: true },
  });

  return product?.id ?? null;
}
