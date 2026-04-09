"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";

type HardLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & {
  href: string;
  children: ReactNode;
};

export function HardLink({ href, children, onClick, ...props }: HardLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    window.location.assign(href);
  }

  return (
    <Link {...props} href={href} prefetch={false} onClick={handleClick}>
      {children}
    </Link>
  );
}
