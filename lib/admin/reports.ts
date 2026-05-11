import { OrderStatus, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type ReportPreset = "this-month" | "last-month" | "this-quarter" | "last-quarter" | "year-to-date" | "last-year" | "custom";

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function resolveReportRange(input: { preset?: string; from?: string; to?: string }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3;
  const preset = (input.preset || "this-month") as ReportPreset;

  if (preset === "custom" && input.from && input.to) {
    const from = startOfDay(new Date(input.from));
    const to = startOfDay(new Date(input.to));
    to.setDate(to.getDate() + 1);
    return { preset, from, to };
  }

  if (preset === "last-month") {
    const from = new Date(year, month - 1, 1);
    return { preset, from, to: new Date(year, month, 1) };
  }

  if (preset === "this-quarter") {
    const from = new Date(year, quarterStartMonth, 1);
    return { preset, from, to: addMonths(from, 3) };
  }

  if (preset === "last-quarter") {
    const from = new Date(year, quarterStartMonth - 3, 1);
    return { preset, from, to: addMonths(from, 3) };
  }

  if (preset === "year-to-date") {
    return { preset, from: new Date(year, 0, 1), to: now };
  }

  if (preset === "last-year") {
    return { preset, from: new Date(year - 1, 0, 1), to: new Date(year, 0, 1) };
  }

  return { preset: "this-month" as const, from: new Date(year, month, 1), to: addMonths(new Date(year, month, 1), 1) };
}

export async function getAdminReportData(input: { preset?: string; from?: string; to?: string }) {
  const range = resolveReportRange(input);
  const where = { createdAt: { gte: range.from, lt: range.to } };
  const [orders, subscriptions, enrollmentsCreated] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        taxLines: true,
        payments: { include: { gateway: true } },
        user: { select: { email: true } },
        offer: { include: { course: true, bundle: true, accessProduct: true } },
      },
    }),
    prisma.subscription.findMany({
      where: { startedAt: { gte: range.from, lt: range.to } },
      include: { order: { include: { offer: { include: { course: true, bundle: true, accessProduct: true } }, user: { select: { email: true } } } } },
      orderBy: { startedAt: "desc" },
    }),
    prisma.enrollment.count({ where: { enrolledAt: { gte: range.from, lt: range.to } } }),
  ]);

  const paidOrders = orders.filter((order) => order.status === OrderStatus.PAID);
  const refundedOrders = orders.filter((order) => order.status === OrderStatus.REFUNDED);
  const grossSales = paidOrders.reduce((sum, order) => sum + Number(order.subtotalAmount || order.totalAmount), 0);
  const discounts = paidOrders.reduce((sum, order) => sum + Number(order.discountAmount), 0);
  const taxCollected = paidOrders.reduce((sum, order) => sum + Number(order.taxAmount), 0);
  const refunds = refundedOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const netRevenue = paidOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0) - refunds;
  const activeSubscriptions = await prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } });
  const cancelledSubscriptions = subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.CANCELED || subscription.endedAt).length;

  const productRevenue = new Map<string, { label: string; amount: number; orders: number }>();
  const gatewayTotals = new Map<string, { label: string; amount: number; orders: number }>();
  const taxByJurisdiction = new Map<string, { label: string; amount: number }>();

  paidOrders.forEach((order) => {
    const product = order.offer.course?.title ?? order.offer.bundle?.title ?? order.offer.accessProduct?.title ?? order.offer.name;
    const productEntry = productRevenue.get(product) ?? { label: product, amount: 0, orders: 0 };
    productEntry.amount += Number(order.totalAmount);
    productEntry.orders += 1;
    productRevenue.set(product, productEntry);

    order.payments.forEach((payment) => {
      const label = payment.gateway.displayName;
      const gatewayEntry = gatewayTotals.get(label) ?? { label, amount: 0, orders: 0 };
      gatewayEntry.amount += Number(payment.amount);
      gatewayEntry.orders += 1;
      gatewayTotals.set(label, gatewayEntry);
    });

    order.taxLines.forEach((line) => {
      const taxEntry = taxByJurisdiction.get(line.jurisdiction) ?? { label: line.jurisdiction, amount: 0 };
      taxEntry.amount += Number(line.amount);
      taxByJurisdiction.set(line.jurisdiction, taxEntry);
    });
  });

  return {
    range,
    orders,
    subscriptions,
    summary: {
      grossSales,
      discounts,
      refunds,
      netRevenue,
      taxCollected,
      orderCount: paidOrders.length,
      averageOrderValue: paidOrders.length ? netRevenue / paidOrders.length : 0,
      activeSubscriptions,
      newSubscriptions: subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.ACTIVE).length,
      cancelledSubscriptions,
      enrollmentsCreated,
    },
    productRevenue: Array.from(productRevenue.values()).sort((left, right) => right.amount - left.amount),
    gatewayTotals: Array.from(gatewayTotals.values()).sort((left, right) => right.amount - left.amount),
    taxByJurisdiction: Array.from(taxByJurisdiction.values()).sort((left, right) => right.amount - left.amount),
  };
}
