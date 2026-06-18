import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type HardLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & {
  href: string;
  children: ReactNode;
};

export function HardLink({ href, children, ...props }: HardLinkProps) {
  return (
    <Link {...props} href={href}>
      {children}
    </Link>
  );
}
