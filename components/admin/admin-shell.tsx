import type { PropsWithChildren } from "react";
import { HardLink } from "@/components/ui/hard-link";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminPageHeader, adminSecondaryButtonClass } from "@/components/admin/admin-ui";

export function AdminShell({ children, title, description }: PropsWithChildren<{ title: string; description?: string }>) {
  return (
    <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-6">
      <aside className="admin-scrollbar sticky top-5 z-20 self-start rounded-[10px] border border-[var(--border)] bg-[var(--surface-panel)] p-3 shadow-[0_1px_2px_rgba(17,24,39,0.04)] lg:max-h-[calc(100vh-2.5rem)] lg:overflow-auto">
        <div className="mb-3 hidden px-2 lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Management</p>
        </div>
        <AdminNav />
      </aside>
      <div className="min-w-0 space-y-5">
        <AdminPageHeader
          title={title}
          description={description}
          actions={
            <>
              <HardLink href="/dashboard" className={adminSecondaryButtonClass}>
                Learner dashboard
              </HardLink>
              <HardLink href="/" className={adminSecondaryButtonClass}>
                Storefront
              </HardLink>
            </>
          }
        />
        {children}
      </div>
    </div>
  );
}
