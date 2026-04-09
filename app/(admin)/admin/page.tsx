import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { HardLink } from "@/components/ui/hard-link";

export const dynamic = "force-dynamic";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export default async function AdminOverviewPage() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [courses, bundles, monthlySales, monthlyOrders, pendingReviews, latestProducts] = await Promise.all([
    prisma.course.count(),
    prisma.bundle.count(),
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
    prisma.testimonial.count({
      where: { isApproved: false },
    }),
    prisma.generatedPage.findMany({
      where: {
        OR: [{ courseId: { not: null } }, { bundleId: { not: null } }],
      },
      include: {
        course: {
          include: {},
        },
        bundle: {
          include: {},
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const totalProducts = courses + bundles;
  const salesThisMonth = Number(monthlySales._sum.totalAmount ?? 0);

  return (
    <AdminShell title="Admin overview" description="Sales, products, and pending reviews in one place.">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-stone-200 bg-white text-stone-950">
          <p className="text-sm text-stone-600">Products</p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">{totalProducts}</p>
          <p className="mt-2 text-sm text-stone-600">{courses} courses, {bundles} bundles</p>
        </Card>
        <Card className="border-stone-200 bg-white text-stone-950">
          <p className="text-sm text-stone-600">Sales this month</p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">{formatMoney(salesThisMonth)}</p>
          <p className="mt-2 text-sm text-stone-600">{monthlyOrders} paid order{monthlyOrders === 1 ? "" : "s"}</p>
        </Card>
        <Card className="border-stone-200 bg-white text-stone-950">
          <p className="text-sm text-stone-600">Reviews to approve</p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">{pendingReviews}</p>
          <p className="mt-2 text-sm text-stone-600">Pending reviews waiting for approval</p>
        </Card>
        <Card className="border-stone-200 bg-white text-stone-950">
          <p className="text-sm text-stone-600">Catalog actions</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <HardLink href="/admin/products" className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100">
              All products
            </HardLink>
            <HardLink href="/admin/courses/new" className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800">
              Add product
            </HardLink>
          </div>
        </Card>
      </div>

      <Card className="space-y-5 border-stone-200 bg-white text-stone-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-950">Latest products</h2>
            <p className="text-sm text-stone-600">Open a product or jump straight into editing.</p>
          </div>
          <HardLink href="/admin/products" className="text-sm font-medium text-stone-950 underline underline-offset-4">
            Manage all products
          </HardLink>
        </div>
        <div className="grid gap-3">
          {latestProducts.map((page) => {
            const product = page.course ?? page.bundle;
            const type = page.course ? "Course" : "Bundle";
            const editHref = page.course ? `/admin/courses/${page.course.id}` : `/admin/bundles/${page.bundle!.id}`;
            const priceSummary = product ? `${product.price.toString()} ${product.currency}` : "No price";

            return (
              <div
                key={page.id}
                className="flex flex-col gap-4 rounded-[24px] border border-stone-200 bg-stone-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-700">
                      {type}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                      {product?.status ?? "DRAFT"}
                    </span>
                  </div>
                  <p className="text-xl font-semibold text-stone-950">{product?.title ?? "Untitled product"}</p>
                  <p className="text-sm text-stone-600">{priceSummary}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <HardLink href={page.path} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100">
                    View page
                  </HardLink>
                  <HardLink href={editHref} className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800">
                    Manage
                  </HardLink>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AdminShell>
  );
}
