"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MetaToastProvider } from "@/components/MetaToastProvider";
import { registerServiceWorker } from "@/lib/serviceWorker";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void registerServiceWorker().catch(() => undefined);
  }, []);

  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <MetaToastProvider />
      </ThemeProvider>
    </SessionProvider>
  );
}
