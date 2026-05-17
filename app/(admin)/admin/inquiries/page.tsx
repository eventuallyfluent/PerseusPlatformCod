import { ContactInquiryStatus } from "@prisma/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminActionBar, AdminDataTable, AdminStatusBadge, adminButtonClass, adminSecondaryButtonClass } from "@/components/admin/admin-ui";
import { HardLink } from "@/components/ui/hard-link";
import { prisma } from "@/lib/db/prisma";
import { updateInquiryStatusAction } from "@/app/(admin)/admin/actions/inquiries";

export const dynamic = "force-dynamic";

function getStatusTone(status: ContactInquiryStatus) {
  if (status === ContactInquiryStatus.UNREAD) return "warning";
  if (status === ContactInquiryStatus.READ) return "success";
  return "neutral";
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; saved?: string; error?: string }>;
}) {
  const query = await searchParams;
  const statusFilter = query.status === "archived" ? ContactInquiryStatus.ARCHIVED : query.status === "read" ? ContactInquiryStatus.READ : ContactInquiryStatus.UNREAD;
  const inquiries = await prisma.contactInquiry.findMany({
    where: { status: statusFilter },
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        select: {
          title: true,
          slug: true,
          publicPath: true,
          legacyUrl: true,
        },
      },
    },
  });
  const returnPath = `/admin/inquiries${query.status ? `?status=${query.status}` : ""}`;

  return (
    <AdminShell title="Course inquiries" description="Dashboard-only messages submitted from course sales pages.">
      {query.saved === "inquiry" ? <p className="rounded-[18px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Inquiry updated.</p> : null}
      {query.error === "inquiry" ? <p className="rounded-[18px] bg-rose-50 px-4 py-3 text-sm text-rose-700">Inquiry could not be updated.</p> : null}

      <AdminActionBar>
        <HardLink href="/admin/inquiries" className={query.status ? adminSecondaryButtonClass : adminButtonClass}>Unread</HardLink>
        <HardLink href="/admin/inquiries?status=read" className={query.status === "read" ? adminButtonClass : adminSecondaryButtonClass}>Read</HardLink>
        <HardLink href="/admin/inquiries?status=archived" className={query.status === "archived" ? adminButtonClass : adminSecondaryButtonClass}>Archived</HardLink>
      </AdminActionBar>

      <AdminDataTable
        columns={[
          { header: "Sender" },
          { header: "Course" },
          { header: "Message" },
          { header: "Status" },
          { header: "Created" },
          { header: "Actions" },
        ]}
        rows={inquiries.map((inquiry) => {
          const courseHref = inquiry.course?.publicPath ?? inquiry.course?.legacyUrl ?? (inquiry.course ? `/course/${inquiry.course.slug}` : null);

          return {
            key: inquiry.id,
            cells: [
              <span key="sender" className="font-semibold text-[var(--text-primary)]">
                {inquiry.name}
                <br />
                <a href={`mailto:${inquiry.email}`} className="font-normal text-[var(--accent)] underline underline-offset-4">{inquiry.email}</a>
              </span>,
              courseHref ? (
                <HardLink key="course" href={courseHref} className="font-semibold text-[var(--accent)] underline underline-offset-4">
                  {inquiry.course?.title ?? "Course"}
                </HardLink>
              ) : (
                inquiry.course?.title ?? "General course question"
              ),
              <span key="message" className="whitespace-pre-wrap text-sm leading-6">{inquiry.message}</span>,
              <AdminStatusBadge key="status" tone={getStatusTone(inquiry.status)}>{inquiry.status.toLowerCase()}</AdminStatusBadge>,
              inquiry.createdAt.toLocaleString(),
              <AdminActionBar key="actions">
                {inquiry.status !== ContactInquiryStatus.READ ? (
                  <form action={updateInquiryStatusAction}>
                    <input type="hidden" name="inquiryId" value={inquiry.id} />
                    <input type="hidden" name="status" value="READ" />
                    <input type="hidden" name="returnPath" value={returnPath} />
                    <button className={adminSecondaryButtonClass}>Mark read</button>
                  </form>
                ) : (
                  <form action={updateInquiryStatusAction}>
                    <input type="hidden" name="inquiryId" value={inquiry.id} />
                    <input type="hidden" name="status" value="UNREAD" />
                    <input type="hidden" name="returnPath" value={returnPath} />
                    <button className={adminSecondaryButtonClass}>Mark unread</button>
                  </form>
                )}
                {inquiry.status !== ContactInquiryStatus.ARCHIVED ? (
                  <form action={updateInquiryStatusAction}>
                    <input type="hidden" name="inquiryId" value={inquiry.id} />
                    <input type="hidden" name="status" value="ARCHIVED" />
                    <input type="hidden" name="returnPath" value={returnPath} />
                    <button className={adminSecondaryButtonClass}>Archive</button>
                  </form>
                ) : null}
              </AdminActionBar>,
            ],
          };
        })}
        empty="No inquiries in this view."
      />
    </AdminShell>
  );
}
