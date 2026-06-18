import { ContactInquiryStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export function formatAdminMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

type DashboardSection<T> =
  | {
      status: "available";
      data: T;
      stale?: boolean;
    }
  | {
      status: "unavailable";
      error: string;
    };

type DashboardMetrics = {
  revenueThisMonth: number;
  monthlyOrders: number;
  totalStudents: number;
  newStudents: number;
  newEnrollments: number;
  manualPaymentOrders: number;
  pendingReviews: number;
  unreadInquiries: number | null;
};

type RecentOrders = Awaited<ReturnType<typeof getRecentOrders>>;
type ReviewsNeedingCheck = Awaited<ReturnType<typeof getReviewsNeedingCheck>>;
type RecentInquiries = Awaited<ReturnType<typeof getRecentInquiries>>;

export type AdminDashboardData = {
  metrics: DashboardSection<DashboardMetrics>;
  recentOrders: DashboardSection<RecentOrders>;
  reviewsNeedingCheck: DashboardSection<ReviewsNeedingCheck>;
  recentInquiries: DashboardSection<RecentInquiries>;
};

const METRICS_CACHE_MS = 45_000;

let metricsCache: { expiresAt: number; data: DashboardMetrics } | null = null;
let metricsRefresh: Promise<DashboardMetrics> | null = null;

function getMonthStart() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  return monthStart;
}

function toDashboardError(error: unknown) {
  return error instanceof Error ? error.message : "Unknown dashboard data error";
}

async function safeDashboardSection<T>(label: string, loader: () => Promise<T>): Promise<DashboardSection<T>> {
  try {
    return { status: "available", data: await loader() };
  } catch (error) {
    console.error(`[admin-dashboard] ${label} unavailable`, error);
    return { status: "unavailable", error: toDashboardError(error) };
  }
}

async function loadDashboardMetrics() {
  const monthStart = getMonthStart();
  const [
    monthlySales,
    monthlyOrders,
    totalStudents,
    newStudents,
    newEnrollments,
    manualPaymentOrders,
    pendingReviews,
  ] = await prisma.$transaction([
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
  ]);

  let unreadInquiries: number | null = null;

  try {
    unreadInquiries = await prisma.contactInquiry.count({
      where: { status: ContactInquiryStatus.UNREAD },
    });
  } catch (error) {
    console.error("[admin-dashboard] unread inquiry metric unavailable", error);
  }

  return {
    revenueThisMonth: Number(monthlySales._sum.totalAmount ?? 0),
    monthlyOrders,
    totalStudents,
    newStudents,
    newEnrollments,
    manualPaymentOrders,
    pendingReviews,
    unreadInquiries,
  };
}

async function getDashboardMetrics(): Promise<DashboardSection<DashboardMetrics>> {
  const now = Date.now();

  if (metricsCache && metricsCache.expiresAt > now) {
    return { status: "available", data: metricsCache.data };
  }

  try {
    metricsRefresh ??= loadDashboardMetrics();
    const data = await metricsRefresh;
    metricsCache = { data, expiresAt: now + METRICS_CACHE_MS };
    return { status: "available", data };
  } catch (error) {
    console.error("[admin-dashboard] metrics unavailable", error);

    if (metricsCache) {
      return { status: "available", data: metricsCache.data, stale: true };
    }

    return { status: "unavailable", error: toDashboardError(error) };
  } finally {
    metricsRefresh = null;
  }
}

async function getRecentOrders() {
  return prisma.order.findMany({
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
}

async function getReviewsNeedingCheck() {
  return prisma.testimonial.findMany({
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
}

async function getRecentInquiries() {
  return prisma.contactInquiry.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    where: {
      status: ContactInquiryStatus.UNREAD,
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
}

export async function getAdminDashboardData() {
  const [metrics, recentOrders, reviewsNeedingCheck, recentInquiries] = await Promise.all([
    getDashboardMetrics(),
    safeDashboardSection("recent orders", getRecentOrders),
    safeDashboardSection("reviews needing check", getReviewsNeedingCheck),
    safeDashboardSection("recent inquiries", getRecentInquiries),
  ]);

  return {
    metrics,
    recentOrders,
    reviewsNeedingCheck,
    recentInquiries,
  } satisfies AdminDashboardData;
}
