"use client";

import { useEffect, useState } from "react";
import {
  normalizePublicThemeMode,
  PUBLIC_THEME_CLASSES,
  PUBLIC_THEME_MODE_STORAGE_KEY,
  type PublicThemeMode,
} from "@/lib/theme/public-theme";

function applyTheme(mode: PublicThemeMode) {
  if (document.body.dataset.publicThemeFamily === "dynamic") {
    document.body.classList.remove(...PUBLIC_THEME_CLASSES);
    document.body.classList.add("theme-perseus-dynamic-1");
    document.body.dataset.publicThemeMode = "dynamic";
    return;
  }

  document.body.classList.remove(...PUBLIC_THEME_CLASSES);
  document.body.classList.add(mode === "light" ? "theme-perseus-light-1" : "theme-perseus-dark-1");
  document.body.dataset.publicThemeFamily = "perseus";
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
    if (document.body.dataset.publicThemeFamily !== "dynamic") {
      window.localStorage.setItem(PUBLIC_THEME_MODE_STORAGE_KEY, theme);
    }
  }, [theme]);

  if (typeof document !== "undefined" && document.body.dataset.publicThemeFamily === "dynamic") {
    return null;
  }

  return (
    <button
      type="button"
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      className="perseus-theme-toggle inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-panel)] text-[var(--text-primary)] transition hover:bg-[var(--surface-panel-strong)]"
      onClick={() => {
        setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
      }}
    >
      <span aria-hidden="true" className="text-base leading-none">{theme === "light" ? "☾" : "☀"}</span>
    </button>
  );
}
