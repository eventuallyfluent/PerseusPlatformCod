import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { absoluteUrl } from "@/lib/utils";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE_TEMPLATE } from "@/lib/seo/site";
import { getPublicThemeClass, PUBLIC_THEME_CLASSES, PUBLIC_THEME_MODE_STORAGE_KEY } from "@/lib/theme/public-theme";
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
  const defaultThemeClass = getPublicThemeClass("dark");
  const themeBootScript = `
    (function() {
      var mode = window.localStorage.getItem("${PUBLIC_THEME_MODE_STORAGE_KEY}") === "light" ? "light" : "dark";
      var classes = ${JSON.stringify([...PUBLIC_THEME_CLASSES])};
      document.body.classList.remove.apply(document.body.classList, classes);
      document.body.classList.add(mode === "light" ? "theme-perseus-light-1" : "theme-perseus-dark-1");
      document.body.dataset.publicThemeMode = mode;
    })();
  `;

  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        data-public-theme-mode="dark"
        className={`${defaultThemeClass} ${displayFont.variable} ${bodyFont.variable}`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {children}
      </body>
    </html>
  );
}
