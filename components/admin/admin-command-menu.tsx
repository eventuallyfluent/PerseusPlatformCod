"use client";

import {
  BarChart3,
  Boxes,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Package,
  Plug,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShoppingCart,
  Star,
  TicketPercent,
  Upload,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { HardLink } from "@/components/ui/hard-link";

type Command = {
  group: "Go to" | "Create";
  href: string;
  icon: LucideIcon;
  keywords: string;
  label: string;
};

const commands: Command[] = [
  { group: "Go to", href: "/admin", label: "Overview", keywords: "home dashboard actions", icon: LayoutDashboard },
  { group: "Go to", href: "/admin/products", label: "Catalog", keywords: "products sellable checkout", icon: Package },
  { group: "Go to", href: "/admin/courses", label: "Courses", keywords: "course content curriculum", icon: GraduationCap },
  { group: "Go to", href: "/admin/bundles", label: "Bundles", keywords: "bundle content courses", icon: Boxes },
  { group: "Go to", href: "/admin/collections", label: "Collections", keywords: "catalog grouping", icon: FolderKanban },
  { group: "Go to", href: "/admin/instructors", label: "Instructors", keywords: "teachers authors", icon: UserRound },
  { group: "Go to", href: "/admin/orders", label: "Orders", keywords: "sales payments transactions", icon: ShoppingCart },
  { group: "Go to", href: "/admin/reports", label: "Reports", keywords: "revenue tax exports", icon: BarChart3 },
  { group: "Go to", href: "/admin/coupons", label: "Coupons", keywords: "discount promotion", icon: TicketPercent },
  { group: "Go to", href: "/admin/students", label: "Students", keywords: "customers learners access", icon: Users },
  { group: "Go to", href: "/admin/inquiries", label: "Inquiries", keywords: "messages questions", icon: MessageSquare },
  { group: "Go to", href: "/admin/reviews", label: "Reviews", keywords: "testimonials approval", icon: Star },
  { group: "Go to", href: "/admin/imports", label: "Imports", keywords: "migration csv batches", icon: Upload },
  { group: "Go to", href: "/admin/gateways", label: "Gateways", keywords: "payments providers creem", icon: Plug },
  { group: "Go to", href: "/admin/settings/taxes", label: "Taxes", keywords: "rates jurisdiction", icon: ReceiptText },
  { group: "Go to", href: "/admin/settings", label: "Settings", keywords: "site theme configuration", icon: Settings },
  { group: "Create", href: "/admin/courses/new", label: "New course", keywords: "add product content", icon: Plus },
  { group: "Create", href: "/admin/bundles/new", label: "New bundle", keywords: "add package", icon: Plus },
  { group: "Create", href: "/admin/instructors/new", label: "New instructor", keywords: "add teacher", icon: Plus },
  { group: "Create", href: "/admin/collections/new", label: "New collection", keywords: "add grouping", icon: Plus },
];

export function AdminCommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function closeMenu() {
    setOpen(false);
    setQuery("");
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) {
          setQuery("");
        }
        setOpen(!open);
      }

      if (event.key === "Escape") {
        setQuery("");
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const filteredCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return commands;

    return commands.filter((command) => `${command.label} ${command.keywords} ${command.group}`.toLowerCase().includes(normalized));
  }, [query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-panel-strong)] px-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
        aria-haspopup="dialog"
      >
        <Search aria-hidden="true" className="size-4" />
        <span>Search or jump</span>
        <kbd className="ml-auto hidden rounded border border-[var(--border)] bg-[var(--surface-panel)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] lg:inline">⌘K</kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/35 px-4 pt-[12vh] backdrop-blur-[2px]" onMouseDown={closeMenu}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin command menu"
            className="w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-panel)] shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
              <Search aria-hidden="true" className="size-5 text-[var(--text-muted)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pages and actions"
                aria-label="Search admin pages and actions"
                className="min-h-14 flex-1 border-0 bg-transparent px-0 text-base shadow-none outline-none focus:ring-0"
              />
              <button type="button" onClick={closeMenu} className="rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--surface-panel-strong)] hover:text-[var(--text-primary)]" aria-label="Close command menu">
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>

            <div className="admin-scrollbar max-h-[min(520px,62vh)] overflow-y-auto p-2">
              {filteredCommands.length > 0 ? (
                (["Go to", "Create"] as const).map((group) => {
                  const groupCommands = filteredCommands.filter((command) => command.group === group);
                  if (groupCommands.length === 0) return null;

                  return (
                    <section key={group} className="py-1">
                      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{group}</p>
                      <div className="grid gap-1">
                        {groupCommands.map((command) => {
                          const Icon = command.icon;
                          return (
                            <HardLink
                              key={`${command.group}-${command.href}`}
                              href={command.href}
                              onClick={closeMenu}
                              className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
                            >
                              <Icon aria-hidden="true" className="size-4 text-[var(--text-muted)]" />
                              <span>{command.label}</span>
                            </HardLink>
                          );
                        })}
                      </div>
                    </section>
                  );
                })
              ) : (
                <div className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">No matching pages or actions.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
