import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      offer: {
        include: { course: true, bundle: true },
      },
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell title="Orders" description="See paid, pending, and failed orders in one place.">
      <Card className="overflow-hidden p-0">
        <table>
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id.slice(0, 8)}</td>
                <td>{order.user?.email ?? "Guest"}</td>
                <td>{order.offer.course?.title ?? order.offer.bundle?.title ?? order.offer.name}</td>
                <td>{order.status}</td>
                <td>
                  {order.totalAmount.toString()} {order.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
