import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminDataTable, AdminStat, AdminStatusBadge } from "@/components/admin/admin-ui";
import { HardLink } from "@/components/ui/hard-link";
import { formatAdminMoney } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await prisma.user.findUnique({
    where: { id },
    include: {
      enrollments: { include: { course: true }, orderBy: { enrolledAt: "desc" } },
      accessGrants: { include: { course: true, order: true, subscription: true }, orderBy: { grantedAt: "desc" } },
      orders: {
        include: {
          offer: { include: { course: true, bundle: true, accessProduct: true } },
          subscription: { include: { gateway: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) notFound();

  const subscriptions = student.orders.flatMap((order) => (order.subscription ? [{ ...order.subscription, order }] : []));

  return (
    <AdminShell title={student.email} description={`Customer record created ${student.createdAt.toLocaleDateString()}.`}>
      <div className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStat label="Enrolled courses" value={student.enrollments.length} />
          <AdminStat label="Orders" value={student.orders.length} />
          <AdminStat label="Active subscriptions" value={subscriptions.filter((subscription) => subscription.status === "ACTIVE").length} />
          <AdminStat label="Access grants" value={student.accessGrants.filter((grant) => grant.isActive).length} />
        </div>

        <AdminDataTable
          columns={[{ header: "Course" }, { header: "Enrolled" }]}
          rows={student.enrollments.map((enrollment) => ({
            key: enrollment.id,
            cells: [
              <HardLink key="course" href={`/admin/courses/${enrollment.courseId}`} className="font-semibold text-[var(--accent)] underline underline-offset-4">{enrollment.course.title}</HardLink>,
              enrollment.enrolledAt.toLocaleDateString(),
            ],
          }))}
          empty="No course enrollments."
        />

        <AdminDataTable
          columns={[{ header: "Subscription" }, { header: "Product" }, { header: "Gateway" }, { header: "Status" }, { header: "Started" }, { header: "Ended" }]}
          rows={subscriptions.map((subscription) => ({
            key: subscription.id,
            cells: [
              subscription.externalSubscriptionId ?? subscription.id.slice(0, 8),
              subscription.order.offer.course?.title ?? subscription.order.offer.bundle?.title ?? subscription.order.offer.accessProduct?.title ?? subscription.order.offer.name,
              subscription.gateway.displayName,
              <AdminStatusBadge key="status" tone={subscription.status === "ACTIVE" ? "success" : subscription.status === "CANCELED" ? "warning" : "neutral"}>{subscription.status}</AdminStatusBadge>,
              subscription.startedAt.toLocaleDateString(),
              subscription.endedAt?.toLocaleDateString() ?? "-",
            ],
          }))}
          empty="No subscriptions."
        />

        <AdminDataTable
          columns={[{ header: "Order" }, { header: "Product" }, { header: "Status" }, { header: "Tax" }, { header: "Total" }, { header: "Date" }]}
          rows={student.orders.map((order) => ({
            key: order.id,
            cells: [
              order.id.slice(0, 8),
              order.offer.course?.title ?? order.offer.bundle?.title ?? order.offer.accessProduct?.title ?? order.offer.name,
              <AdminStatusBadge key="status" tone={order.status === "PAID" ? "success" : order.status === "REFUNDED" ? "warning" : "neutral"}>{order.status}</AdminStatusBadge>,
              formatAdminMoney(Number(order.taxAmount), order.currency),
              formatAdminMoney(Number(order.totalAmount), order.currency),
              order.createdAt.toLocaleDateString(),
            ],
          }))}
          empty="No orders."
        />
      </div>
    </AdminShell>
  );
}
