import { ContactInquiryStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

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

  const monthlySales = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: {
      status: OrderStatus.PAID,
      createdAt: { gte: monthStart },
    },
  });
  const monthlyOrders = await prisma.order.count({
    where: {
      status: OrderStatus.PAID,
      createdAt: { gte: monthStart },
    },
  });
  const totalStudents = await prisma.user.count();
  const newStudents = await prisma.user.count({
    where: { createdAt: { gte: monthStart } },
  });
  const newEnrollments = await prisma.enrollment.count({
    where: { enrolledAt: { gte: monthStart } },
  });
  const manualPaymentOrders = await prisma.order.count({
    where: {
      payments: {
        some: {
          status: {
            in: [PaymentStatus.AWAITING_BANK_TRANSFER, PaymentStatus.UNDER_REVIEW, PaymentStatus.AUTHORIZED],
          },
        },
      },
    },
  });
  const pendingReviews = await prisma.testimonial.count({
    where: { isApproved: false },
  });
  const unreadInquiries = await prisma.contactInquiry.count({
    where: { status: ContactInquiryStatus.UNREAD },
  });
  const recentOrders = await prisma.order.findMany({
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
  });
  const reviewsNeedingCheck = await prisma.testimonial.findMany({
    take: 6,
    orderBy: { position: "asc" },
    where: { isApproved: false },
    select: {
      id: true,
      name: true,
      quote: true,
      rating: true,
      recommendsProduct: true,
      course: { select: { title: true } },
      bundle: { select: { title: true } },
    },
  });
  const recentInquiries = await prisma.contactInquiry.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    where: {
      status: {
        not: ContactInquiryStatus.ARCHIVED,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      message: true,
      status: true,
      createdAt: true,
      course: { select: { title: true } },
    },
  });

  return {
    revenueThisMonth: Number(monthlySales._sum.totalAmount ?? 0),
    monthlyOrders,
    totalStudents,
    newStudents,
    newEnrollments,
    manualPaymentOrders,
    pendingReviews,
    unreadInquiries,
    recentOrders,
    reviewsNeedingCheck,
    recentInquiries,
  };
}
