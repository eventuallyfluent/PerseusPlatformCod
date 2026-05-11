import { AccessGrantSourceType, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ensureEnrollment } from "@/lib/enrollments/ensure-enrollment";

export async function grantCourseAccess(input: {
  userId: string;
  courseIds: string[];
  orderId?: string | null;
  subscriptionId?: string | null;
  sourceType: AccessGrantSourceType;
}) {
  const uniqueCourseIds = Array.from(new Set(input.courseIds));

  await Promise.all(
    uniqueCourseIds.map(async (courseId) => {
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: input.userId, courseId } },
      });
      await ensureEnrollment(input.userId, courseId);
      await prisma.courseAccessGrant.create({
        data: {
          userId: input.userId,
          courseId,
          orderId: input.orderId,
          subscriptionId: input.subscriptionId,
          sourceType: input.sourceType,
          createdEnrollment: !existingEnrollment,
        },
      });
    }),
  );
}

export async function linkSubscriptionGrants(orderId: string, subscriptionId: string) {
  await prisma.courseAccessGrant.updateMany({
    where: {
      orderId,
      sourceType: AccessGrantSourceType.SUBSCRIPTION,
      subscriptionId: null,
    },
    data: { subscriptionId },
  });
}

export async function revokeSubscriptionAccess(input: { orderId?: string | null; subscriptionId?: string | null }) {
  const subscription = input.subscriptionId
    ? await prisma.subscription.findUnique({ where: { id: input.subscriptionId } })
    : input.orderId
      ? await prisma.subscription.findUnique({ where: { orderId: input.orderId } })
      : null;
  const orderId = input.orderId ?? subscription?.orderId ?? null;
  const subscriptionId = input.subscriptionId ?? subscription?.id ?? null;

  if (!orderId && !subscriptionId) return;

  const revokedAt = new Date();
  const grants = await prisma.courseAccessGrant.findMany({
    where: {
      isActive: true,
      OR: [
        ...(orderId ? [{ orderId }] : []),
        ...(subscriptionId ? [{ subscriptionId }] : []),
      ],
      sourceType: AccessGrantSourceType.SUBSCRIPTION,
    },
  });

  await prisma.courseAccessGrant.updateMany({
    where: { id: { in: grants.map((grant) => grant.id) } },
    data: { isActive: false, revokedAt },
  });

  if (subscriptionId) {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: SubscriptionStatus.CANCELED, endedAt: revokedAt },
    });
  } else if (orderId) {
    await prisma.subscription.updateMany({
      where: { orderId },
      data: { status: SubscriptionStatus.CANCELED, endedAt: revokedAt },
    });
  }

  await Promise.all(
    grants.map(async (grant) => {
      const otherActiveGrant = await prisma.courseAccessGrant.findFirst({
        where: {
          userId: grant.userId,
          courseId: grant.courseId,
          isActive: true,
          id: { not: grant.id },
        },
      });

      if (grant.createdEnrollment && !otherActiveGrant) {
        await prisma.enrollment.deleteMany({
          where: {
            userId: grant.userId,
            courseId: grant.courseId,
          },
        });
      }
    }),
  );
}
