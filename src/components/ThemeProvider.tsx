"use client";

import { useEffect, useState } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const theme = stored || (prefersDark ? "dark" : "light");

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    }

    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
