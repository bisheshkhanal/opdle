"use client";

import { useEffect, useRef } from "react";
import type { TileStatus } from "@/lib/types";

interface TileRevealParticlesProps {
  status: TileStatus;
  animationDelay: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

const BURST_DURATION_MS = 350;

function getParticleColor(status: TileStatus) {
  switch (status) {
    case "correct":
      return "rgba(74, 222, 128, 0.95)";
    case "partial":
      return "rgba(250, 204, 21, 0.92)";
    case "higher":
    case "lower":
      return "rgba(96, 165, 250, 0.92)";
    case "wrong":
      return "rgba(248, 113, 113, 0.9)";
    case "unknown":
    default:
      return "rgba(203, 213, 225, 0.82)";
  }
}

export default function TileRevealParticles({
  status,
  animationDelay,
}: TileRevealParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId = 0;
    let timeoutId = 0;

    const startBurst = () => {
      const context = canvas.getContext("2d");
      if (!context) return;

      const bounds = canvas.getBoundingClientRect();
      const width = Math.max(bounds.width, 1);
      const height = Math.max(bounds.height, 1);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(pixelRatio, pixelRatio);

      const centerX = width / 2;
      const centerY = height / 2;
      const color = getParticleColor(status);
      const particleCount = 8 + Math.floor(Math.random() * 5);
      const particles: Particle[] = Array.from(
        { length: particleCount },
        () => {
          const angle = Math.random() * Math.PI * 2;
          const speed = 14 + Math.random() * 20;

          return {
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 1.2 + Math.random() * 1.8,
            alpha: 0.95,
          };
        }
      );

      const startTime = performance.now();

      const render = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / BURST_DURATION_MS, 1);

        context.clearRect(0, 0, width, height);

        particles.forEach((particle) => {
          particle.x += particle.vx * 0.016;
          particle.y += particle.vy * 0.016;
          particle.vx *= 0.94;
          particle.vy *= 0.94;
          particle.radius *= 0.985;
          particle.alpha = 1 - progress;

          context.globalAlpha = particle.alpha;
          context.fillStyle = color;
          context.beginPath();
          context.arc(
            particle.x,
            particle.y,
            Math.max(particle.radius, 0.6),
            0,
            Math.PI * 2
          );
          context.fill();
        });

        context.globalAlpha = 1;

        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(render);
          return;
        }

        context.clearRect(0, 0, width, height);
      };

      animationFrameId = window.requestAnimationFrame(render);
    };

    timeoutId = window.setTimeout(startBurst, Math.max(animationDelay, 0));

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(animationFrameId);

      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [animationDelay, status]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
