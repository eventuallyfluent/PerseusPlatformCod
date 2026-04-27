import { prisma } from "@/lib/db/prisma";

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
  const setting = await prisma.siteSetting.findUnique({
    where: { key: PUBLIC_THEME_FAMILY_SETTING_KEY },
    select: { value: true },
  });

  if (!setting || typeof setting.value !== "object" || setting.value === null) {
    return "original";
  }

  const family = "family" in setting.value ? setting.value.family : null;

  return normalizePublicThemeFamily(typeof family === "string" ? family : null);
}
