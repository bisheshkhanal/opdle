"use client";

import React, { useCallback, useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!modalRef.current) return [];
    const selectors = [
      "a[href]",
      "button",
      "input",
      "select",
      "textarea",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");
    return Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(selectors)
    ).filter((el) => !el.hasAttribute("disabled"));
  }, []);

  // Focus trap: Tab / Shift+Tab cycling
  const handleTabTrap = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [getFocusableElements]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keydown", handleTabTrap);
      document.body.style.overflow = "hidden";

      // Focus first focusable element (or modal container) after render
      requestAnimationFrame(() => {
        const focusable = getFocusableElements();
        if (focusable.length > 0) {
          focusable[0].focus();
        } else if (modalRef.current) {
          modalRef.current.focus();
        }
      });
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", handleTabTrap);
      document.body.style.overflow = "unset";

      // Restore focus to trigger element when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    };
  }, [isOpen, onClose, handleTabTrap, getFocusableElements]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative max-h-[90vh] w-full ${maxWidthClass} animate-scale-in overflow-y-auto rounded-xl border-2 border-gold-500 bg-parchment-100 shadow-float outline-none dark:bg-navy-800`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold-500/30 bg-parchment-100/95 p-4 backdrop-blur-sm dark:bg-navy-800/95">
          <h2
            id="modal-title"
            className="font-display text-xl font-bold text-navy-900 dark:text-gold-400"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="-mr-2 rounded-lg p-2 text-navy-600 transition-colors hover:bg-gold-500/10 hover:text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-500 dark:text-parchment-400 dark:hover:text-gold-400"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="p-4 text-navy-800 dark:text-parchment-200">
          {children}
        </div>
      </div>
    </div>
  );
}
