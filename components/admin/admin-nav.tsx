"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HardLink } from "@/components/ui/hard-link";

const links = [
  { href: "/admin", label: "Overview", mark: "OV" },
  { href: "/admin/products", label: "Products", mark: "PR" },
  { href: "/admin/courses", label: "Courses", mark: "CO" },
  { href: "/admin/bundles", label: "Bundles", mark: "BU" },
  { href: "/admin/orders", label: "Orders", mark: "OR" },
  { href: "/admin/coupons", label: "Coupons", mark: "CP" },
  { href: "/admin/students", label: "Students", mark: "ST" },
  { href: "/admin/collections", label: "Collections", mark: "CL" },
  { href: "/admin/instructors", label: "Instructors", mark: "IN" },
  { href: "/admin/reviews", label: "Reviews", mark: "RV" },
  { href: "/admin/imports", label: "Imports", mark: "IM" },
  { href: "/admin/gateways", label: "Gateways", mark: "GW" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
      {links.map((link) => {
        const active = isActive(pathname, link.href);

        return (
          <HardLink
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-panel-strong)] hover:text-[var(--text-primary)]",
              active && "bg-[var(--accent-soft)] text-[var(--accent)] shadow-sm",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid h-6 w-7 place-items-center rounded-md border border-[var(--border)] text-[10px] font-bold tracking-normal text-[var(--text-muted)]",
                active && "border-[var(--accent)]/25 bg-[var(--surface-panel)] text-[var(--accent)]",
              )}
            >
              {link.mark}
            </span>
            <span>{link.label}</span>
          </HardLink>
        );
      })}
    </nav>
  );
}
