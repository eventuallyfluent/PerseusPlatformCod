import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";

export function formatAdminMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export async function getAdminDashboardData() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    monthlySales,
    monthlyOrders,
    totalStudents,
    newStudents,
    newEnrollments,
    manualPaymentOrders,
    pendingReviews,
    recentOrders,
    latestCourses,
    latestBundles,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: OrderStatus.PAID,
        createdAt: { gte: monthStart },
      },
    }),
    prisma.order.count({
      where: {
        status: OrderStatus.PAID,
        createdAt: { gte: monthStart },
      },
    }),
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: monthStart } },
    }),
    prisma.enrollment.count({
      where: { enrolledAt: { gte: monthStart } },
    }),
    prisma.order.count({
      where: {
        payments: {
          some: {
            status: {
              in: [PaymentStatus.AWAITING_BANK_TRANSFER, PaymentStatus.UNDER_REVIEW, PaymentStatus.AUTHORIZED],
            },
          },
        },
      },
    }),
    prisma.testimonial.count({
      where: { isApproved: false },
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        currency: true,
        createdAt: true,
        user: {
          select: {
            email: true,
          },
        },
        offer: {
          select: {
            name: true,
            course: { select: { title: true } },
            bundle: { select: { title: true } },
          },
        },
      },
    }),
    prisma.course.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        price: true,
        currency: true,
        publicPath: true,
        legacyUrl: true,
        slug: true,
        updatedAt: true,
      },
    }),
    prisma.bundle.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        price: true,
        currency: true,
        publicPath: true,
        legacyUrl: true,
        slug: true,
        updatedAt: true,
      },
    }),
  ]);

  const latestContent = [
    ...latestCourses.map((course) => ({
      ...course,
      type: "Course" as const,
      editHref: `/admin/courses/${course.id}`,
      viewHref: resolveCoursePublicPath(course),
    })),
    ...latestBundles.map((bundle) => ({
      ...bundle,
      type: "Bundle" as const,
      editHref: `/admin/bundles/${bundle.id}`,
      viewHref: resolveBundlePublicPath(bundle),
    })),
  ]
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
    .slice(0, 6);

  return {
    revenueThisMonth: Number(monthlySales._sum.totalAmount ?? 0),
    monthlyOrders,
    totalStudents,
    newStudents,
    newEnrollments,
    manualPaymentOrders,
    pendingReviews,
    recentOrders,
    latestContent,
  };
}
