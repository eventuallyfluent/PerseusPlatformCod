"use client";

import {
  BarChart3,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Package,
  Plug,
  ReceiptText,
  Settings,
  ShoppingCart,
  Star,
  TicketPercent,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HardLink } from "@/components/ui/hard-link";

const navGroups = [
  {
    label: "Workspace",
    links: [{ href: "/admin", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    links: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/collections", label: "Collections", icon: FolderKanban },
      { href: "/admin/instructors", label: "Instructors", icon: UserRound },
    ],
  },
  {
    label: "Commerce",
    links: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
    ],
  },
  {
    label: "Customers",
    links: [
      { href: "/admin/students", label: "Students", icon: Users },
      { href: "/admin/inquiries", label: "Inquiries", icon: MessageSquare },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Operations",
    links: [
      { href: "/admin/imports", label: "Imports", icon: Upload },
      { href: "/admin/gateways", label: "Gateways", icon: Plug },
      { href: "/admin/settings/taxes", label: "Taxes", icon: ReceiptText },
    ],
  },
  {
    label: "System",
    links: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  if (href === "/admin/products") {
    return ["/admin/products", "/admin/courses", "/admin/bundles"].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function PendingMark() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden="true"
      className={cn(
        "ml-auto size-1.5 shrink-0 rounded-full bg-current opacity-0 transition-opacity delay-100",
        pending && "animate-pulse opacity-40",
      )}
    />
  );
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="admin-scrollbar flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-4 lg:overflow-visible lg:pb-0">
      {navGroups.map((group) => (
        <div key={group.label} className="contents lg:block">
          <p className="mb-1.5 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] lg:block">
            {group.label}
          </p>
          <div className="contents lg:grid lg:gap-1">
            {group.links.map((link) => {
              const active = isActive(pathname, link.href);
              const Icon = link.icon;

              return (
                <HardLink
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-panel-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30",
                    active && "bg-[var(--accent-soft)] text-[var(--text-primary)] shadow-sm ring-1 ring-[var(--accent)]/10",
                  )}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />
                  <span>{link.href === "/admin/products" ? "Catalog" : link.label}</span>
                  <PendingMark />
                </HardLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
