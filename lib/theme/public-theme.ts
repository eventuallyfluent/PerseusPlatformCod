export const PUBLIC_THEME_MODE_STORAGE_KEY = "perseus-theme-mode";

export type PublicThemeMode = "dark" | "light";

export const PUBLIC_THEME_CLASSES = ["theme-perseus-dark-1", "theme-perseus-light-1"] as const;

export function normalizePublicThemeMode(value: string | null | undefined): PublicThemeMode {
  return value === "light" ? "light" : "dark";
}

export function getPublicThemeClass(mode: PublicThemeMode) {
  return mode === "light" ? "theme-perseus-light-1" : "theme-perseus-dark-1";
}
