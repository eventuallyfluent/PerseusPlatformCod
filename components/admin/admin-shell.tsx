import type { PropsWithChildren } from "react";
import { HardLink } from "@/components/ui/hard-link";
import { AdminCommandMenu } from "@/components/admin/admin-command-menu";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminPageHeader, adminSecondaryButtonClass } from "@/components/admin/admin-ui";

export function AdminFrame({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto grid min-h-screen max-w-[1600px] gap-5 px-3 py-3 lg:grid-cols-[236px_minmax(0,1fr)] lg:px-5 lg:py-5">
      <aside className="admin-scrollbar sticky top-5 z-20 self-start rounded-[10px] border border-[var(--border)] bg-[var(--surface-panel)] p-3 shadow-[0_1px_2px_rgba(17,24,39,0.04)] lg:max-h-[calc(100vh-2.5rem)] lg:overflow-auto">
        <div className="mb-4 hidden border-b border-[var(--border)] px-2 pb-4 lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Perseus Platform</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Operator workspace</p>
          <div className="mt-4">
            <AdminCommandMenu />
          </div>
        </div>
        <div className="mb-3 lg:hidden">
          <AdminCommandMenu />
        </div>
        <AdminNav />
      </aside>
      <main className="min-w-0 py-2 lg:py-0">{children}</main>
    </div>
  );
}

export function AdminShell({ children, title, description }: PropsWithChildren<{ title: string; description?: string }>) {
  return (
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
  );
}
