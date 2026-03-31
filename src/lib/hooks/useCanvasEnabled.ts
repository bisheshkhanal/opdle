"use client";
import { useState, useEffect } from "react";

export function useCanvasEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const hasWebGL = !!window.WebGLRenderingContext;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setEnabled(!isMobile && hasWebGL && !prefersReducedMotion);
  }, []);
  return enabled;
}
