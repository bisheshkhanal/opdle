"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useCanvasEnabled } from "@/lib/hooks";

interface WinCelebrationProps {
  isVisible: boolean;
}

const PARTICLE_COUNT = 36;
const BURST_DURATION_MS = 2000;
const COLORS = [0xf4c430, 0xfada7a, 0xffffff];

interface ParticleState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: number;
  rotationSpeed: number;
  scale: number;
}

export default function WinCelebration({ isVisible }: WinCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousVisibleRef = useRef(isVisible);
  const runningRef = useRef(false);
  const startedAtRef = useRef(0);
  const animationFrameIdRef = useRef<number>(0);
  const particleStatesRef = useRef<ParticleState[]>([]);
  const isPageVisibleRef = useRef(
    typeof document === "undefined" ? true : !document.hidden
  );
  const hideTimeoutRef = useRef<number | null>(null);
  const [isBurstActive, setIsBurstActive] = useState(false);
  const canvasEnabled = useCanvasEnabled();

  useEffect(() => {
    if (!canvasEnabled) {
      setIsBurstActive(false);
      runningRef.current = false;
    }
  }, [canvasEnabled]);

  useEffect(() => {
    if (!canvasEnabled) {
      previousVisibleRef.current = isVisible;
      return;
    }

    const triggered = !previousVisibleRef.current && isVisible;
    previousVisibleRef.current = isVisible;

    if (!triggered) {
      return;
    }

    startedAtRef.current = performance.now();
    runningRef.current = true;
    setIsBurstActive(true);
  }, [canvasEnabled, isVisible]);

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

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -window.innerWidth / 2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      -window.innerHeight / 2,
      0.1,
      100
    );
    camera.position.z = 10;

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    const instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      PARTICLE_COUNT
    );
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instancedMesh.frustumCulled = false;
    scene.add(instancedMesh);

    const dummy = new THREE.Object3D();

    const resetParticles = () => {
      const particles: ParticleState[] = [];

      for (let index = 0; index < PARTICLE_COUNT; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 5 + Math.random() * 9;
        const lift = 12 + Math.random() * 10;
        const scale = 12 + Math.random() * 14;

        particles.push({
          position: new THREE.Vector3(0, 0, 0),
          velocity: new THREE.Vector3(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed + lift,
            (Math.random() - 0.5) * 40
          ),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.35,
          scale,
        });

        instancedMesh.setColorAt(
          index,
          new THREE.Color(COLORS[index % COLORS.length])
        );
      }

      particleStatesRef.current = particles;
      instancedMesh.instanceColor!.needsUpdate = true;
    };

    const handleResize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.left = -window.innerWidth / 2;
      camera.right = window.innerWidth / 2;
      camera.top = window.innerHeight / 2;
      camera.bottom = -window.innerHeight / 2;
      camera.updateProjectionMatrix();
    };

    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
    };

    const animate = () => {
      animationFrameIdRef.current = window.requestAnimationFrame(animate);

      if (!runningRef.current || !isPageVisibleRef.current) {
        return;
      }

      const elapsedMs = performance.now() - startedAtRef.current;
      const progress = Math.min(elapsedMs / BURST_DURATION_MS, 1);
      const deltaSeconds = 1 / 60;
      const gravity = 18;
      const drag = 0.985;
      const particles = particleStatesRef.current;

      material.opacity = (1 - progress) * 0.95;

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];

        particle.position.x += particle.velocity.x;
        particle.position.y += particle.velocity.y;
        particle.position.z += particle.velocity.z * 0.1;
        particle.velocity.y -= gravity * deltaSeconds;
        particle.velocity.x *= drag;
        particle.velocity.y *= drag;
        particle.velocity.z *= drag;
        particle.rotation += particle.rotationSpeed;

        dummy.position.copy(particle.position);
        dummy.rotation.set(0, 0, particle.rotation);
        dummy.scale.setScalar(particle.scale * (1 - progress * 0.35));
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(index, dummy.matrix);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);

      if (progress >= 1) {
        runningRef.current = false;
        material.opacity = 0;
        if (hideTimeoutRef.current) {
          window.clearTimeout(hideTimeoutRef.current);
        }
        hideTimeoutRef.current = window.setTimeout(() => {
          setIsBurstActive(false);
          hideTimeoutRef.current = null;
        }, 0);
      }
    };

    resetParticles();
    animate();

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.cancelAnimationFrame(animationFrameIdRef.current);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      scene.remove(instancedMesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [canvasEnabled]);

  useEffect(() => {
    if (!canvasEnabled || !isBurstActive) {
      return;
    }

    const particles = particleStatesRef.current;
    if (particles.length === 0) {
      return;
    }

    for (let index = 0; index < particles.length; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 9;
      const lift = 12 + Math.random() * 10;
      const scale = 12 + Math.random() * 14;
      const particle = particles[index];

      particle.position.set(0, 0, 0);
      particle.velocity.set(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed + lift,
        (Math.random() - 0.5) * 40
      );
      particle.rotation = Math.random() * Math.PI * 2;
      particle.rotationSpeed = (Math.random() - 0.5) * 0.35;
      particle.scale = scale;
    }
  }, [canvasEnabled, isBurstActive]);

  if (!canvasEnabled) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 60,
        opacity: isBurstActive ? 1 : 0,
        visibility: isBurstActive ? "visible" : "hidden",
      }}
    />
  );
}
