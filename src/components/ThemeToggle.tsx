"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme") as Theme | null;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const initial: Theme = stored || (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  if (!mounted) {
    return (
      <button
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-parchment-300/60 bg-parchment-50/70"
        aria-label="Toggle theme"
      >
        <span className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="group relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-parchment-300/60 bg-parchment-50/70 shadow-soft transition-all duration-300 hover:border-gold-400/60 hover:shadow-glow dark:border-slate-600/60 dark:bg-slate-800/70 dark:hover:border-gold-400/50"
      aria-label={
        theme === "light" ? "Switch to dark mode" : "Switch to light mode"
      }
    >
      <svg
        className={`absolute h-4 w-4 text-gold-500 transition-all duration-300 ${
          theme === "light"
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      <svg
        className={`absolute h-4 w-4 text-gold-400 transition-all duration-300 ${
          theme === "dark"
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-0 opacity-0"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
      <span className="sr-only">
        {theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      </span>
    </button>
  );
}
