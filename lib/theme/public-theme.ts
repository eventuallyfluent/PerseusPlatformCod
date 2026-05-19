export const PUBLIC_THEME_MODE_STORAGE_KEY = "perseus-theme-mode";
export const PUBLIC_THEME_FAMILY_SETTING_KEY = "public_theme_family";

export type PublicThemeMode = "dark" | "light";
export type PublicThemeFamily = "perseus" | "dynamic";

export const PUBLIC_THEME_CLASSES = ["theme-perseus-dark-1", "theme-perseus-light-1", "theme-perseus-dynamic-1"] as const;

export function normalizePublicThemeMode(value: string | null | undefined): PublicThemeMode {
  return value === "light" ? "light" : "dark";
}

export function normalizePublicThemeFamily(value: unknown): PublicThemeFamily {
  return value === "dynamic" ? "dynamic" : "perseus";
}

export function getPublicThemeClass(mode: PublicThemeMode) {
  return mode === "light" ? "theme-perseus-light-1" : "theme-perseus-dark-1";
}

export function getPublicThemeFamilyClass(family: PublicThemeFamily, mode: PublicThemeMode) {
  return family === "dynamic" ? "theme-perseus-dynamic-1" : getPublicThemeClass(mode);
}
