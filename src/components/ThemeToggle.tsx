"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ems-theme";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
}

function persistTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  document.cookie = `ems-theme=${theme}; path=/; max-age=31536000; samesite=lax`;
}

export function ThemeToggle({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    persistTheme(theme);
    applyTheme(theme);
  }, [theme]);

  function onToggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle theme"
      className="inline-flex w-full items-center justify-between rounded-xl border border-slate-300/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-900"
    >
      <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] dark:bg-slate-800">
        {theme === "dark" ? "Dark" : "Light"}
      </span>
    </button>
  );
}
