"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useCanvasEnabled } from "@/lib/hooks";

const PARTICLE_COUNT = 45;
const WRAP_PADDING = 10;

export default function AmbientParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasEnabled = useCanvasEnabled();

  useEffect(() => {
    if (!canvasEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const camera = new THREE.OrthographicCamera(
      -window.innerWidth / 2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      -window.innerHeight / 2,
      0.1,
      100
    );
    camera.position.z = 10;

    const scene = new THREE.Scene();
    const isDark = document.documentElement.classList.contains("dark");
    const particleColor = isDark
      ? "rgba(244, 196, 48, 1)"
      : "rgba(250, 218, 122, 1)";

    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = 16;
    spriteCanvas.height = 16;
    const context = spriteCanvas.getContext("2d");
    if (!context) {
      renderer.dispose();
      return;
    }

    const gradient = context.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, particleColor);
    gradient.addColorStop(1, particleColor.replace(", 1)", ", 0)"));
    context.fillStyle = gradient;
    context.fillRect(0, 0, 16, 16);

    const texture = new THREE.CanvasTexture(spriteCanvas);
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities: Array<{ vx: number; vy: number }> = [];

    let halfWidth = window.innerWidth / 2;
    let halfHeight = window.innerHeight / 2;

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * window.innerWidth;
      positions[index * 3 + 1] = (Math.random() - 0.5) * window.innerHeight;
      positions[index * 3 + 2] = 0;

      velocities.push({
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.2 + Math.random() * 0.4,
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: isDark ? 3 : 2,
      color: isDark ? 0xf4c430 : 0xfada7a,
      map: texture,
      transparent: true,
      opacity: isDark ? 0.3 : 0.15,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let animationFrameId = 0;
    let isVisible = !document.hidden;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };

    const handleResize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      camera.left = -window.innerWidth / 2;
      camera.right = window.innerWidth / 2;
      camera.top = window.innerHeight / 2;
      camera.bottom = -window.innerHeight / 2;
      camera.updateProjectionMatrix();

      halfWidth = window.innerWidth / 2;
      halfHeight = window.innerHeight / 2;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("resize", handleResize);

    const animate = () => {
      animationFrameId = window.requestAnimationFrame(animate);
      if (!isVisible) return;

      const positionAttribute = geometry.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      const nextPositions = positionAttribute.array as Float32Array;

      for (let index = 0; index < PARTICLE_COUNT; index += 1) {
        const particleIndex = index * 3;
        nextPositions[particleIndex] += velocities[index].vx;
        nextPositions[particleIndex + 1] += velocities[index].vy;

        if (nextPositions[particleIndex + 1] > halfHeight + WRAP_PADDING) {
          nextPositions[particleIndex + 1] = -halfHeight - WRAP_PADDING;
          nextPositions[particleIndex] =
            (Math.random() - 0.5) * window.innerWidth;
        }

        if (nextPositions[particleIndex] > halfWidth + WRAP_PADDING) {
          nextPositions[particleIndex] = -halfWidth - WRAP_PADDING;
        }

        if (nextPositions[particleIndex] < -halfWidth - WRAP_PADDING) {
          nextPositions[particleIndex] = halfWidth + WRAP_PADDING;
        }
      }

      positionAttribute.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);
      scene.remove(points);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, [canvasEnabled]);

  if (!canvasEnabled) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
