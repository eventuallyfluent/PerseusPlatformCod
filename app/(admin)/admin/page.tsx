import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

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
          include: {
            offers: {
              where: { isPublished: true },
              take: 1,
            },
          },
        },
        bundle: {
          include: {
            offers: {
              where: { isPublished: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const totalProducts = courses + bundles;
  const salesThisMonth = Number(monthlySales._sum.totalAmount ?? 0);

  return (
    <AdminShell title="Admin overview" description="Track products, revenue, and review approvals from one place.">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="text-white">
          <p className="text-sm text-[#b8add7]">Products</p>
          <p className="mt-3 text-3xl font-semibold text-white">{totalProducts}</p>
          <p className="mt-2 text-sm text-[#d7cffa]">{courses} courses, {bundles} bundles</p>
        </Card>
        <Card className="text-white">
          <p className="text-sm text-[#b8add7]">Sales this month</p>
          <p className="mt-3 text-3xl font-semibold text-white">{formatMoney(salesThisMonth)}</p>
          <p className="mt-2 text-sm text-[#d7cffa]">{monthlyOrders} paid order{monthlyOrders === 1 ? "" : "s"}</p>
        </Card>
        <Card className="text-white">
          <p className="text-sm text-[#b8add7]">Reviews to approve</p>
          <p className="mt-3 text-3xl font-semibold text-white">{pendingReviews}</p>
          <p className="mt-2 text-sm text-[#d7cffa]">Pending testimonials hidden from public pages</p>
        </Card>
        <Card className="text-white">
          <p className="text-sm text-[#b8add7]">Catalog actions</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/admin/products" className="rounded-full border border-[rgba(255,255,255,0.14)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[rgba(255,255,255,0.08)]">
              All products
            </Link>
            <Link href="/admin/courses/new" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-[#f0e8ff]">
              Add product
            </Link>
          </div>
        </Card>
      </div>

      <Card className="space-y-5 text-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Latest products</h2>
            <p className="text-sm text-[#c8bedf]">Jump into editing or preview the public page.</p>
          </div>
          <Link href="/admin/products" className="text-sm font-medium text-white underline underline-offset-4">
            Manage all products
          </Link>
        </div>
        <div className="grid gap-3">
          {latestProducts.map((page) => {
            const product = page.course ?? page.bundle;
            const type = page.course ? "Course" : "Bundle";
            const editHref = page.course ? `/admin/courses/${page.course.id}` : `/admin/bundles/${page.bundle!.id}`;
            const offerCount = product?.offers.length ?? 0;

            return (
              <div
                key={page.id}
                className="flex flex-col gap-4 rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-[rgba(255,255,255,0.14)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d6cbf5]">
                      {type}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9e93c6]">
                      {product?.status ?? "DRAFT"}
                    </span>
                  </div>
                  <p className="text-xl font-semibold text-white">{product?.title ?? "Untitled product"}</p>
                  <p className="text-sm text-[#c8bedf]">
                    {offerCount} published offer{offerCount === 1 ? "" : "s"} attached
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={page.path} className="rounded-full border border-[rgba(255,255,255,0.14)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[rgba(255,255,255,0.08)]">
                    View page
                  </Link>
                  <Link href={editHref} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-[#f0e8ff]">
                    Manage
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AdminShell>
  );
}
