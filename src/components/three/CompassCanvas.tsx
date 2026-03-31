"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface CompassCanvasProps {
  gameState?: "idle" | "wrong-guess" | "correct-guess";
  className?: string;
}

export default function CompassCanvas({
  gameState = "idle",
  className = "",
}: CompassCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(gameState);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(420, 420);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;

    const scene = new THREE.Scene();

    const isDark = document.documentElement.classList.contains("dark");
    const baseColor = isDark ? 0xe2e8f0 : 0x15294a;
    const baseThreeColor = new THREE.Color(baseColor);
    const goldColor = new THREE.Color(0xf4c430);
    let currentIsDark = isDark;

    const shape = new THREE.Shape();
    const outerR = 0.85;
    const innerR = 0.35;
    const points = 8;

    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;

      if (i === 0) {
        shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      } else {
        shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
    }

    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: baseColor,
      side: THREE.DoubleSide,
    });
    const compass = new THREE.Mesh(geometry, material);
    scene.add(compass);

    const ringGeometry = new THREE.RingGeometry(0.88, 0.92, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    scene.add(ring);

    const innerRingGeometry = new THREE.RingGeometry(0.68, 0.71, 64);
    const innerRingMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      side: THREE.DoubleSide,
    });
    const innerRingMesh = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    scene.add(innerRingMesh);

    let rotationSpeed = 0.003;
    let fastSpinTimer = 0;
    let goldPulseTimer = 0;
    let animFrameId = 0;
    let isVisible = true;
    let previousState = stateRef.current;

    const handleVisibility = () => {
      isVisible = !document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibility);

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      if (!isVisible) {
        return;
      }

      const state = stateRef.current;

      if (state !== previousState) {
        if (state === "wrong-guess") {
          fastSpinTimer = 90;
        }

        if (state === "correct-guess") {
          goldPulseTimer = 60;
        }

        previousState = state;
      }

      if (fastSpinTimer > 0) {
        rotationSpeed = 0.05;
        fastSpinTimer -= 1;
      } else {
        rotationSpeed = 0.003;
      }

      if (goldPulseTimer > 0) {
        const t = goldPulseTimer / 60;
        material.color.lerpColors(goldColor, baseThreeColor, 1 - t);
        ringMaterial.color.lerpColors(goldColor, baseThreeColor, 1 - t);
        innerRingMaterial.color.lerpColors(goldColor, baseThreeColor, 1 - t);
        goldPulseTimer -= 1;
      } else {
        material.color.copy(baseThreeColor);
        ringMaterial.color.copy(baseThreeColor);
        innerRingMaterial.color.copy(baseThreeColor);
      }

      compass.rotation.z += rotationSpeed;
      ring.rotation.z -= rotationSpeed * 0.3;

      renderer.render(scene, camera);
    };

    const themeObserver = new MutationObserver(() => {
      currentIsDark = document.documentElement.classList.contains("dark");
      const newColor = currentIsDark ? 0xe2e8f0 : 0x15294a;
      baseThreeColor.setHex(newColor);
      material.color.copy(baseThreeColor);
      ringMaterial.color.copy(baseThreeColor);
      innerRingMaterial.color.copy(baseThreeColor);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      document.removeEventListener("visibilitychange", handleVisibility);
      themeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      innerRingGeometry.dispose();
      innerRingMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ pointerEvents: "none" }}
    />
  );
}
