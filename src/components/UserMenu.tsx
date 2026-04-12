"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";

interface UserMenuProps {
  onSignInClick: () => void;
}

export function UserMenu({ onSignInClick }: UserMenuProps) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const focusItem = (index: number) => {
    const items =
      menuRef?.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (!items || items.length === 0) return;
    const clamped = ((index % items.length) + items.length) % items.length;
    setFocusedIndex(clamped);
    items[clamped].focus();
  };

  const closeMenu = () => {
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Loading skeleton — avoids layout shift
  if (status === "loading") {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-parchment-300 dark:bg-slate-700" />
    );
  }

  // Unauthenticated — show Sign In button
  if (status === "unauthenticated" || !session) {
    return (
      <button
        onClick={onSignInClick}
        className="rounded-lg px-3 py-1.5 text-sm font-bold text-navy-600 transition-colors hover:bg-navy-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        Sign In
      </button>
    );
  }

  const username = session.user?.name ?? "?";
  const initial = username.charAt(0).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      {/* Avatar button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
              requestAnimationFrame(() => focusItem(0));
            } else {
              focusItem(0);
            }
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
              requestAnimationFrame(() => focusItem(-1));
            } else {
              focusItem(-1);
            }
          }
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-700 text-sm font-bold text-gold-400 ring-2 ring-gold-400/30 transition-all hover:ring-gold-400/60 dark:bg-slate-600 dark:ring-gold-500/30 dark:hover:ring-gold-500/60"
        aria-label={`User menu for ${username}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {initial}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="menu"
          onKeyDown={(e) => {
            const items =
              menuRef.current?.querySelectorAll<HTMLElement>(
                '[role="menuitem"]'
              );
            const count = items?.length ?? 0;
            if (count === 0) return;

            if (e.key === "ArrowDown") {
              e.preventDefault();
              const next = focusedIndex < count - 1 ? focusedIndex + 1 : 0;
              focusItem(next);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const prev = focusedIndex > 0 ? focusedIndex - 1 : count - 1;
              focusItem(prev);
            } else if (e.key === "Enter") {
              e.preventDefault();
              const active = items?.[focusedIndex] as
                | HTMLAnchorElement
                | HTMLButtonElement
                | undefined;
              active?.click();
            } else if (e.key === "Escape") {
              e.preventDefault();
              closeMenu();
            }
          }}
          className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-parchment-300/80 bg-parchment-100 shadow-float dark:border-slate-700/80 dark:bg-slate-800"
        >
          {/* Username header */}
          <div className="border-b border-parchment-300/60 px-3 py-2.5 dark:border-slate-700/60">
            <p className="truncate text-xs font-medium text-navy-500 dark:text-slate-400">
              Signed in as
            </p>
            <p className="truncate text-sm font-bold text-navy-800 dark:text-slate-100">
              {username}
            </p>
          </div>

          {/* Menu items */}
          <div className="p-1">
            <Link
              href={`/profile/${username}`}
              role="menuitem"
              tabIndex={-1}
              onClick={() => setIsOpen(false)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-navy-700 transition-colors hover:bg-parchment-200/80 dark:text-slate-200 dark:hover:bg-slate-700/80${focusedIndex === 0 ? "bg-parchment-200/80 dark:bg-slate-700/80" : ""}`}
            >
              <svg
                className="h-4 w-4 text-navy-500 dark:text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              View Profile
            </Link>
            <button
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                setIsOpen(false);
                void signOut();
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-tile-wrong transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20${focusedIndex === 1 ? "bg-red-50 dark:bg-red-900/20" : ""}`}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
