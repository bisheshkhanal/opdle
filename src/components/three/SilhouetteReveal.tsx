"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useCanvasEnabled } from "@/lib/hooks";

interface SilhouetteRevealProps {
  imageUrl: string;
  isVisible: boolean;
  onComplete?: () => void;
}

const REVEAL_DURATION_MS = 2000;

function FallbackSilhouette() {
  return (
    <svg
      className="h-16 w-16 text-white/80"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0zm5.12 7.36A9 9 0 1118.36 5.64 7.5 7.5 0 0120 11.25c0 2.72-1.45 5.1-3.62 6.11a.5.5 0 01-.26 0z"
      />
    </svg>
  );
}

export default function SilhouetteReveal({
  imageUrl,
  isVisible,
  onComplete,
}: SilhouetteRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousVisibleRef = useRef(isVisible);
  const runningRef = useRef(false);
  const startedAtRef = useRef(0);
  const animationFrameIdRef = useRef<number>(0);
  const isPageVisibleRef = useRef(
    typeof document === "undefined" ? true : !document.hidden
  );
  const onCompleteRef = useRef(onComplete);
  const [isActive, setIsActive] = useState(false);
  const canvasEnabled = useCanvasEnabled();

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!canvasEnabled) {
      setIsActive(isVisible);
      return;
    }

    const triggered = !previousVisibleRef.current && isVisible;
    previousVisibleRef.current = isVisible;

    if (!triggered) {
      if (!isVisible) {
        runningRef.current = false;
        setIsActive(false);
      }
      return;
    }

    startedAtRef.current = performance.now();
    runningRef.current = true;
    setIsActive(true);
  }, [canvasEnabled, isVisible]);

  useEffect(() => {
    if (!canvasEnabled) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

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
    camera.position.z = 5;

    const geometry = new THREE.PlaneGeometry(1, 1);
    const imageMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 1,
      depthWrite: false,
      toneMapped: false,
    });
    const overlayMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      toneMapped: false,
    });

    const imagePlane = new THREE.Mesh(geometry, imageMaterial);
    const overlayPlane = new THREE.Mesh(geometry, overlayMaterial);
    imagePlane.position.z = 0;
    overlayPlane.position.z = 0.01;
    scene.add(imagePlane, overlayPlane);

    let texture: THREE.Texture | null = null;

    const updatePlaneScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const textureImage = texture?.image as
        | { width?: number; height?: number }
        | undefined;

      const imageWidth = textureImage?.width ?? viewportWidth;
      const imageHeight = textureImage?.height ?? viewportHeight;
      const imageAspect = imageWidth / imageHeight;
      const viewportAspect = viewportWidth / viewportHeight;

      let planeWidth = viewportWidth;
      let planeHeight = viewportHeight;

      if (imageAspect > viewportAspect) {
        planeHeight = viewportHeight;
        planeWidth = viewportHeight * imageAspect;
      } else {
        planeWidth = viewportWidth;
        planeHeight = viewportWidth / imageAspect;
      }

      imagePlane.scale.set(planeWidth, planeHeight, 1);
      overlayPlane.scale.set(planeWidth, planeHeight, 1);
    };

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      imageUrl,
      (loadedTexture) => {
        texture = loadedTexture;
        texture.colorSpace = THREE.SRGBColorSpace;
        imageMaterial.map = texture;
        imageMaterial.needsUpdate = true;
        updatePlaneScale();
      },
      undefined,
      () => {
        runningRef.current = false;
        setIsActive(false);
        onCompleteRef.current?.();
      }
    );

    const handleResize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.left = -window.innerWidth / 2;
      camera.right = window.innerWidth / 2;
      camera.top = window.innerHeight / 2;
      camera.bottom = -window.innerHeight / 2;
      camera.updateProjectionMatrix();
      updatePlaneScale();
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
      const progress = Math.min(elapsedMs / REVEAL_DURATION_MS, 1);

      overlayMaterial.opacity = 1 - progress;
      renderer.render(scene, camera);

      if (progress >= 1) {
        runningRef.current = false;
        setIsActive(false);
        onCompleteRef.current?.();
      }
    };

    updatePlaneScale();
    animate();

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.cancelAnimationFrame(animationFrameIdRef.current);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      scene.remove(imagePlane, overlayPlane);
      geometry.dispose();
      if (texture) {
        texture.dispose();
      }
      imageMaterial.dispose();
      overlayMaterial.dispose();
      renderer.dispose();
    };
  }, [canvasEnabled, imageUrl]);

  if (!isVisible) {
    return null;
  }

  if (!canvasEnabled) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[70]"
      >
        <div className="relative h-full w-full">
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-contain"
            onError={(e) => {
              e.currentTarget.src = "/characters/fallback.svg";
            }}
          />
          <div
            className="absolute inset-0 bg-black"
            style={{
              animation: `silhouette-fade ${REVEAL_DURATION_MS}ms ease-out forwards`,
            }}
            onAnimationEnd={() => onCompleteRef.current?.()}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <FallbackSilhouette />
          </div>
        </div>
        <style jsx>{`
          @keyframes silhouette-fade {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
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
        zIndex: 70,
        opacity: isActive ? 1 : 0,
        visibility: isActive ? "visible" : "hidden",
      }}
    />
  );
}
