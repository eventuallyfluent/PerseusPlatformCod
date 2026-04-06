import Link from "next/link";
import type { PropsWithChildren } from "react";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/bundles", label: "Bundles" },
  { href: "/admin/instructors", label: "Instructors" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/imports", label: "Imports" },
  { href: "/admin/gateways", label: "Gateways" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({ children, title, description }: PropsWithChildren<{ title: string; description?: string }>) {
  return (
    <div className="mx-auto grid max-w-[1580px] gap-6 px-6 py-10 [--card:#ffffff] [--border:rgba(24,24,32,0.10)] [--shadow-soft:0_18px_40px_rgba(17,24,39,0.06)] lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="rounded-[28px] border border-stone-200 bg-stone-50 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-stone-950">Admin</h2>
        <nav className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-2xl px-4 py-3 text-sm font-semibold text-stone-800 transition hover:bg-white hover:text-stone-950 focus:bg-white focus:text-stone-950"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="space-y-6">
        <header className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-stone-950">{title}</h1>
              {description ? <p className="max-w-3xl text-sm leading-7 text-stone-600">{description}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
              >
                Learner Dashboard
              </Link>
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
              >
                View Storefront
              </Link>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
