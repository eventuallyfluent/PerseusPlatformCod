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
    <div className="mx-auto grid max-w-[1540px] gap-5 px-5 py-8 [--card:#ffffff] [--border:rgba(24,24,32,0.08)] [--shadow-soft:0_14px_34px_rgba(17,24,39,0.05)] lg:grid-cols-[235px_minmax(0,1fr)]">
      <aside className="rounded-[26px] border border-stone-200/80 bg-[linear-gradient(180deg,#faf8f3,#f5f1e8)] p-4 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-900">Admin</h2>
        <nav className="space-y-2">
          {links.map((link) => (
            <HardLink
              key={link.href}
              href={link.href}
              className="block rounded-2xl px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-white hover:text-stone-950 focus:bg-white focus:text-stone-950"
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
              <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-stone-950">{title}</h1>
              {description ? <p className="max-w-3xl text-sm leading-6 text-stone-600">{description}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <HardLink
                href="/dashboard"
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
              >
                Learner Dashboard
              </HardLink>
              <HardLink
                href="/"
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
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
