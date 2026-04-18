import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { absoluteUrl } from "@/lib/utils";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE_TEMPLATE } from "@/lib/seo/site";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: SITE_NAME,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`theme-perseus-dark-1 ${displayFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  );
}
