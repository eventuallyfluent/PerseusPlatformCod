"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HardLink } from "@/components/ui/hard-link";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/bundles", label: "Bundles" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/instructors", label: "Instructors" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/imports", label: "Imports" },
  { href: "/admin/gateways", label: "Gateways" },
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
              "inline-flex min-h-11 shrink-0 items-center rounded-lg px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-panel-strong)] hover:text-[var(--text-primary)]",
              active && "bg-[var(--accent-soft)] text-[var(--accent)] shadow-sm",
            )}
          >
            <span>{link.label}</span>
          </HardLink>
        );
      })}
    </nav>
  );
}
