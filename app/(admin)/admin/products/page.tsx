import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";

export const dynamic = "force-dynamic";

type ProductRow = {
  id: string;
  type: "Course" | "Bundle";
  title: string;
  owner: string;
  status: string;
  price: string;
  updatedAt: Date;
  editHref: string;
  viewHref: string;
  previewHref?: string;
};

export default async function AdminProductsPage() {
  const [courses, bundles] = await Promise.all([
    prisma.course.findMany({
      include: {
        instructor: true,
        modules: {
          include: {
            lessons: {
              orderBy: { position: "asc" },
              take: 1,
            },
          },
          orderBy: { position: "asc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.bundle.findMany({
      include: {
        courses: {
          include: {
            course: {
              include: {
                instructor: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const products: ProductRow[] = [
    ...courses.map((course) => ({
      id: course.id,
      type: "Course" as const,
      title: course.title,
      owner: course.instructor.name,
      status: course.status,
      price: `${course.price.toString()} ${course.currency}`,
      updatedAt: course.updatedAt,
      editHref: `/admin/courses/${course.id}`,
      viewHref: resolveCoursePublicPath(course),
      previewHref: course.modules[0]?.lessons[0] ? `/learn/${course.slug}/${course.modules[0].lessons[0].slug}` : undefined,
    })),
    ...bundles.map((bundle) => ({
      id: bundle.id,
      type: "Bundle" as const,
      title: bundle.title,
      owner:
        bundle.courses.length > 0
          ? `${bundle.courses.length} course${bundle.courses.length === 1 ? "" : "s"}`
          : "No courses yet",
      status: bundle.status,
      price: `${bundle.price.toString()} ${bundle.currency}`,
      updatedAt: bundle.updatedAt,
      editHref: `/admin/bundles/${bundle.id}`,
      viewHref: resolveBundlePublicPath(bundle),
    })),
  ].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());

  return (
    <AdminShell
      title="Products"
      description="See every course and bundle, then jump straight into managing it."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3 text-sm text-stone-600">
          <span className="rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.78)] px-4 py-2">
            {courses.length} course{courses.length === 1 ? "" : "s"}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.78)] px-4 py-2">
            {bundles.length} bundle{bundles.length === 1 ? "" : "s"}
          </span>
        </div>
        <Link href="/admin/courses/new" className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">
          Add product
        </Link>
      </div>

      <Card className="overflow-hidden p-0">
        <table>
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th>Type</th>
              <th>Title</th>
              <th>Owner / Contents</th>
              <th>Status</th>
              <th>Price</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={`${product.type}-${product.id}`}>
                <td>
                  <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                    {product.type}
                  </span>
                </td>
                <td>{product.title}</td>
                <td>{product.owner}</td>
                <td>{product.status}</td>
                <td>{product.price}</td>
                <td>{product.updatedAt.toLocaleDateString()}</td>
                <td className="space-x-3">
                  <Link href={product.viewHref} className="underline">
                    View
                  </Link>
                  {product.previewHref ? (
                    <Link href={product.previewHref} className="underline">
                      Preview
                    </Link>
                  ) : null}
                  <Link href={product.editHref} className="underline" prefetch={false}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
