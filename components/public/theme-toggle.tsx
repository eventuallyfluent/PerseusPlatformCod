"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "perseus-theme";

type ThemeName = "dark" | "light";

function applyTheme(theme: ThemeName) {
  document.body.classList.remove("theme-perseus-dark-1", "theme-perseus-light-1");
  document.body.classList.add(theme === "light" ? "theme-perseus-light-1" : "theme-perseus-dark-1");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  });

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
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
