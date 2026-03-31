"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useCanvasEnabled } from "@/lib/hooks/useCanvasEnabled";

interface EmptyStateOrbProps {
  className?: string;
}

function FallbackIcon() {
  return (
    <svg
      className="h-8 w-8 text-navy-600 dark:text-slate-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export default function EmptyStateOrb({ className = "" }: EmptyStateOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasEnabled = useCanvasEnabled();

  useEffect(() => {
    if (!canvasEnabled) return;

    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    let isDark = document.documentElement.classList.contains("dark");
    const shellColor = new THREE.Color(isDark ? 0xcbd5e1 : 0x17335c);
    const ringColor = new THREE.Color(isDark ? 0x94a3b8 : 0x3c5a84);
    const glowColor = new THREE.Color(isDark ? 0xf8d36a : 0xf4c430);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
    camera.position.set(0, 0, 6);

    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 1.1 : 1.4);
    const keyLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.25 : 1.5);
    keyLight.position.set(3, 4, 5);

    const pulseLight = new THREE.PointLight(
      glowColor,
      isDark ? 0.9 : 1.1,
      8,
      2
    );
    pulseLight.position.set(0, 0.2, 3);

    scene.add(ambientLight, keyLight, pulseLight);

    const orbGroup = new THREE.Group();
    orbGroup.rotation.x = THREE.MathUtils.degToRad(18);
    orbGroup.rotation.z = THREE.MathUtils.degToRad(10);
    scene.add(orbGroup);

    const shellGeometry = new THREE.IcosahedronGeometry(1.02, 1);
    const shellMaterial = new THREE.MeshStandardMaterial({
      color: shellColor,
      transparent: true,
      opacity: isDark ? 0.16 : 0.28,
      emissive: shellColor.clone(),
      emissiveIntensity: isDark ? 0.2 : 0.22,
      metalness: 0.35,
      roughness: 0.45,
      side: THREE.DoubleSide,
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);

    const shellEdgesGeometry = new THREE.EdgesGeometry(shellGeometry, 18);
    const shellEdgesMaterial = new THREE.LineBasicMaterial({
      color: shellColor,
      transparent: true,
      opacity: isDark ? 0.48 : 0.62,
    });
    const shellEdges = new THREE.LineSegments(
      shellEdgesGeometry,
      shellEdgesMaterial
    );

    const outerRingGeometry = new THREE.TorusGeometry(1.28, 0.03, 12, 96);
    const outerRingMaterial = new THREE.MeshStandardMaterial({
      color: ringColor,
      transparent: true,
      opacity: isDark ? 0.6 : 0.72,
      emissive: ringColor.clone(),
      emissiveIntensity: isDark ? 0.26 : 0.24,
      metalness: 0.5,
      roughness: 0.35,
    });
    const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);

    const middleRingGeometry = new THREE.TorusGeometry(0.96, 0.025, 10, 72);
    const middleRingMaterial = new THREE.MeshStandardMaterial({
      color: shellColor,
      transparent: true,
      opacity: isDark ? 0.38 : 0.5,
      emissive: shellColor.clone(),
      emissiveIntensity: isDark ? 0.2 : 0.2,
      metalness: 0.35,
      roughness: 0.5,
    });
    const middleRing = new THREE.Mesh(middleRingGeometry, middleRingMaterial);
    middleRing.rotation.x = Math.PI / 2;

    const compassGroup = new THREE.Group();

    const needleGeometry = new THREE.ConeGeometry(0.13, 0.52, 4);
    const northMaterial = new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor.clone(),
      emissiveIntensity: isDark ? 0.8 : 0.75,
      metalness: 0.4,
      roughness: 0.35,
    });
    const southMaterial = new THREE.MeshStandardMaterial({
      color: shellColor,
      emissive: shellColor.clone(),
      emissiveIntensity: isDark ? 0.22 : 0.22,
      metalness: 0.35,
      roughness: 0.45,
    });

    const northNeedle = new THREE.Mesh(needleGeometry, northMaterial);
    northNeedle.position.y = 0.42;

    const southNeedle = new THREE.Mesh(needleGeometry, southMaterial);
    southNeedle.position.y = -0.42;
    southNeedle.rotation.z = Math.PI;

    const eastNeedle = new THREE.Mesh(needleGeometry, southMaterial);
    eastNeedle.position.x = 0.42;
    eastNeedle.rotation.z = -Math.PI / 2;
    eastNeedle.scale.setScalar(0.72);

    const westNeedle = new THREE.Mesh(needleGeometry, southMaterial);
    westNeedle.position.x = -0.42;
    westNeedle.rotation.z = Math.PI / 2;
    westNeedle.scale.setScalar(0.72);

    compassGroup.add(northNeedle, southNeedle, eastNeedle, westNeedle);

    const coreGeometry = new THREE.SphereGeometry(0.18, 24, 24);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor.clone(),
      emissiveIntensity: isDark ? 1.2 : 1.1,
      transparent: true,
      opacity: isDark ? 0.96 : 0.96,
      metalness: 0.2,
      roughness: 0.3,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);

    orbGroup.add(shell, shellEdges, outerRing, middleRing, compassGroup, core);

    let animationFrameId = 0;
    let isVisible = !document.hidden;
    let pausedAt = 0;
    let pausedDuration = 0;
    const startTime = performance.now();
    const rotationSpeed = (Math.PI * 2) / 30;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const nextWidth = Math.max(width, 1);
      const nextHeight = Math.max(height, 1);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(nextWidth, nextHeight, false);

      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
    };

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && pausedAt > 0) {
        pausedDuration += performance.now() - pausedAt;
        pausedAt = 0;
      }

      if (!isVisible) {
        pausedAt = performance.now();
      }
    };

    resize();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(container);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("resize", resize);

    const animate = () => {
      animationFrameId = window.requestAnimationFrame(animate);

      if (!isVisible) {
        return;
      }

      const elapsed = (performance.now() - startTime - pausedDuration) / 1000;
      const pulse = 0.5 + Math.sin(elapsed * 1.5) * 0.5;

      orbGroup.rotation.y = elapsed * rotationSpeed;
      orbGroup.rotation.z =
        THREE.MathUtils.degToRad(10) + Math.sin(elapsed * 0.35) * 0.05;
      outerRing.rotation.y = -elapsed * 0.22;
      middleRing.rotation.z = elapsed * 0.28;
      compassGroup.rotation.z = elapsed * 0.12;

      coreMaterial.emissiveIntensity = (isDark ? 0.9 : 0.85) + pulse * 0.45;
      shellMaterial.emissiveIntensity = (isDark ? 0.16 : 0.18) + pulse * 0.08;
      outerRingMaterial.emissiveIntensity = (isDark ? 0.2 : 0.2) + pulse * 0.08;
      middleRingMaterial.emissiveIntensity =
        (isDark ? 0.16 : 0.16) + pulse * 0.05;
      northMaterial.emissiveIntensity = (isDark ? 0.55 : 0.55) + pulse * 0.4;
      pulseLight.intensity = (isDark ? 0.55 : 0.7) + pulse * 0.35;

      renderer.render(scene, camera);
    };

    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
      const newShell = new THREE.Color(isDark ? 0xcbd5e1 : 0x17335c);
      const newRing = new THREE.Color(isDark ? 0x94a3b8 : 0x3c5a84);
      const newGlow = new THREE.Color(isDark ? 0xf8d36a : 0xf4c430);

      shellColor.copy(newShell);
      ringColor.copy(newRing);
      glowColor.copy(newGlow);

      shellMaterial.color.copy(newShell);
      shellMaterial.emissive.copy(newShell);
      shellMaterial.opacity = isDark ? 0.16 : 0.28;

      shellEdgesMaterial.color.copy(newShell);
      shellEdgesMaterial.opacity = isDark ? 0.48 : 0.62;

      outerRingMaterial.color.copy(newRing);
      outerRingMaterial.emissive.copy(newRing);
      outerRingMaterial.opacity = isDark ? 0.6 : 0.72;

      middleRingMaterial.color.copy(newShell);
      middleRingMaterial.emissive.copy(newShell);
      middleRingMaterial.opacity = isDark ? 0.38 : 0.5;

      northMaterial.color.copy(newGlow);
      northMaterial.emissive.copy(newGlow);

      southMaterial.color.copy(newShell);
      southMaterial.emissive.copy(newShell);

      coreMaterial.color.copy(newGlow);
      coreMaterial.emissive.copy(newGlow);
      coreMaterial.opacity = isDark ? 0.96 : 0.96;

      pulseLight.color.copy(newGlow);
      ambientLight.intensity = isDark ? 1.1 : 1.4;
      keyLight.intensity = isDark ? 1.25 : 1.5;
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", resize);
      resizeObserver?.disconnect();
      themeObserver.disconnect();

      scene.remove(orbGroup, ambientLight, keyLight, pulseLight);

      shellGeometry.dispose();
      shellMaterial.dispose();
      shellEdgesGeometry.dispose();
      shellEdgesMaterial.dispose();
      outerRingGeometry.dispose();
      outerRingMaterial.dispose();
      middleRingGeometry.dispose();
      middleRingMaterial.dispose();
      needleGeometry.dispose();
      northMaterial.dispose();
      southMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      renderer.dispose();
    };
  }, [canvasEnabled]);

  return (
    <div
      className={`relative inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-navy-100/70 ring-1 ring-navy-200/40 dark:bg-slate-700/70 dark:ring-slate-600/40 ${className}`.trim()}
      aria-hidden="true"
    >
      {canvasEnabled ? (
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ pointerEvents: "none", background: "transparent" }}
        />
      ) : (
        <FallbackIcon />
      )}
    </div>
  );
}
