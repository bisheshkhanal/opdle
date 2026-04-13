"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MetaToastProvider } from "@/components/MetaToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <MetaToastProvider />
      </ThemeProvider>
    </SessionProvider>
  );
}
