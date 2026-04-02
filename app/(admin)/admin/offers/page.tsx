import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { saveOfferAction } from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const [offers, courses, bundles] = await Promise.all([
    prisma.offer.findMany({
      include: { course: true, bundle: true },
      orderBy: { name: "asc" },
    }),
    prisma.course.findMany({
      orderBy: { title: "asc" },
    }),
    prisma.bundle.findMany({
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <AdminShell title="Offers" description="Sellable layer for single courses and bundles.">
      <Card>
        <form action={saveOfferAction} className="grid gap-4 md:grid-cols-2">
          <label>
            Course
            <select name="courseId" defaultValue="">
              <option value="">No course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Bundle
            <select name="bundleId" defaultValue="">
              <option value="">No bundle</option>
              {bundles.map((bundle) => (
                <option key={bundle.id} value={bundle.id}>
                  {bundle.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Offer name
            <input name="name" />
          </label>
          <label>
            Offer type
            <select name="type" defaultValue="ONE_TIME">
              <option value="ONE_TIME">ONE_TIME</option>
              <option value="SUBSCRIPTION">SUBSCRIPTION</option>
              <option value="PAYMENT_PLAN">PAYMENT_PLAN</option>
            </select>
          </label>
          <label>
            Price
            <input name="price" type="number" step="0.01" />
          </label>
          <label>
            Currency
            <input name="currency" defaultValue="USD" />
          </label>
          <label>
            Compare-at price
            <input name="compareAtPrice" type="number" step="0.01" />
          </label>
          <label>
            Checkout path
            <input name="checkoutPath" />
          </label>
          <label className="flex items-center gap-3 text-stone-700">
            <input className="w-auto" type="checkbox" name="isPublished" value="true" />
            Published
          </label>
          <div className="md:col-span-2">
            <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">Create offer</button>
          </div>
        </form>
      </Card>
      <Card className="overflow-hidden p-0">
        <table>
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th>Offer</th>
              <th>Product</th>
              <th>Type</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td>{offer.name}</td>
                <td>{offer.course?.title ?? offer.bundle?.title ?? "—"}</td>
                <td>{offer.type}</td>
                <td>
                  {offer.price.toString()} {offer.currency}
                </td>
                <td>{offer.isPublished ? "Published" : "Draft"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
