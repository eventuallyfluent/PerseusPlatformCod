import { prisma } from "@/lib/db/prisma";
import type { HomepageFooterPayload } from "@/lib/homepage/sections";

export const PUBLIC_THEME_FAMILY_SETTING_KEY = "public-theme-family";
export const PUBLIC_THEME_MODE_STORAGE_KEY = "perseus-theme-mode";

export type PublicThemeFamily = "original" | "modern";
export type PublicThemeMode = "dark" | "light";

export const PUBLIC_THEME_CLASSES = [
  "theme-perseus-original-dark",
  "theme-perseus-original-light",
  "theme-perseus-modern-dark",
  "theme-perseus-modern-light",
  // Back-compat with older local storage / older markup.
  "theme-perseus-dark-1",
  "theme-perseus-light-1",
] as const;

export function normalizePublicThemeFamily(value: string | null | undefined): PublicThemeFamily {
  return value === "modern" ? "modern" : "original";
}

export function normalizePublicThemeMode(value: string | null | undefined): PublicThemeMode {
  return value === "light" ? "light" : "dark";
}

export function getPublicThemeClass(family: PublicThemeFamily, mode: PublicThemeMode) {
  return `theme-perseus-${family}-${mode}` as const;
}

export async function getPublicThemeFamily(): Promise<PublicThemeFamily> {
  let setting: { value: unknown } | null = null;

  try {
    setting = await prisma.siteSetting.findUnique({
      where: { key: PUBLIC_THEME_FAMILY_SETTING_KEY },
      select: { value: true },
    });
  } catch {
    setting = null;
  }

  if (setting && typeof setting.value === "object" && setting.value !== null) {
    const family = "family" in setting.value ? setting.value.family : null;
    return normalizePublicThemeFamily(typeof family === "string" ? family : null);
  }

  try {
    const footerSection = await prisma.homepageSection.findUnique({
      where: { type: "FOOTER" },
      select: { payload: true },
    });

    if (!footerSection || typeof footerSection.payload !== "object" || footerSection.payload === null) {
      return "original";
    }

    const footerPayload = footerSection.payload as HomepageFooterPayload;
    return normalizePublicThemeFamily(footerPayload.themeFamily);
  } catch {
    return "original";
  }
}
