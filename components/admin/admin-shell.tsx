import type { PropsWithChildren } from "react";
import { HardLink } from "@/components/ui/hard-link";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/bundles", label: "Bundles" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/instructors", label: "Instructors" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/imports", label: "Imports" },
  { href: "/admin/gateways", label: "Gateways" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({ children, title, description }: PropsWithChildren<{ title: string; description?: string }>) {
  return (
    <div className="mx-auto grid max-w-[1540px] gap-6 px-5 py-8 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="rounded-[var(--radius-panel)] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-panel),var(--surface-panel-strong))] p-5 shadow-[var(--shadow-panel)]">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-primary)]">Admin</h2>
        <nav className="space-y-2">
          {links.map((link) => (
            <HardLink
              key={link.href}
              href={link.href}
              className="block rounded-[var(--radius-card)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-panel)] hover:text-[var(--text-primary)] focus:bg-[var(--surface-panel)] focus:text-[var(--text-primary)]"
            >
              {link.label}
            </HardLink>
          ))}
        </nav>
      </aside>
      <div className="space-y-5">
        <header className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{title}</h1>
              {description ? <p className="max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <HardLink
                href="/dashboard"
                className="inline-flex items-center rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-panel-strong)]"
              >
                Learner Dashboard
              </HardLink>
              <HardLink
                href="/"
                className="inline-flex items-center rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-panel-strong)]"
              >
                View Storefront
              </HardLink>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
