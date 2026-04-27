"use client";

import { useEffect, useState } from "react";
import {
  getPublicThemeClass,
  normalizePublicThemeFamily,
  normalizePublicThemeMode,
  PUBLIC_THEME_CLASSES,
  PUBLIC_THEME_MODE_STORAGE_KEY,
  type PublicThemeMode,
} from "@/lib/theme/public-theme";

function applyTheme(mode: PublicThemeMode) {
  const family = normalizePublicThemeFamily(document.body.dataset.publicThemeFamily);
  document.body.classList.remove(...PUBLIC_THEME_CLASSES);
  document.body.classList.add(getPublicThemeClass(family, mode));
  document.body.dataset.publicThemeMode = mode;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<PublicThemeMode>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    return normalizePublicThemeMode(window.localStorage.getItem(PUBLIC_THEME_MODE_STORAGE_KEY));
  });

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(PUBLIC_THEME_MODE_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <button
      type="button"
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-panel)] text-[var(--text-primary)] transition hover:bg-[var(--surface-panel-strong)]"
      onClick={() => {
        setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
      }}
    >
      <span aria-hidden="true" className="text-base leading-none">{theme === "light" ? "☾" : "☀"}</span>
    </button>
  );
}
