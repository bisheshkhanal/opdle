"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import type { Character } from "@/lib/types";
import { searchCharacters } from "@/lib/search";

interface AutocompleteProps {
  characters: Character[];
  guessedIds: string[];
  onSelect: (character: Character) => void;
  disabled?: boolean;
}

export function Autocomplete({
  characters,
  guessedIds,
  onSelect,
  disabled = false,
}: AutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Character[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter out already guessed characters
  const availableCharacters = useMemo(
    () => characters.filter((c) => !guessedIds.includes(c.id)),
    [characters, guessedIds]
  );

  const updateResults = useCallback(
    (searchQuery: string) => {
      if (searchQuery.trim().length === 0) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      const matches = searchCharacters(availableCharacters, searchQuery, 8);
      setResults(matches);
      setSelectedIndex(0);
      setIsOpen(searchQuery.trim().length > 0);
    },
    [availableCharacters]
  );

  useEffect(() => {
    updateResults(query);
  }, [query, updateResults]);

  const handleSelect = (character: Character) => {
    onSelect(character);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        handleSelect(results[0]);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const selectedItem = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex, isOpen]);

  return (
    <div className="relative w-full max-w-md">
      <div className="group relative">
        {/* Search icon with gold accent on focus */}
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-600 transition-colors duration-200 group-focus-within:text-gold-500 dark:text-gold-400 dark:group-focus-within:text-gold-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          disabled={disabled}
          placeholder="Search for a pirate..."
          className="w-full rounded-2xl border-2 border-parchment-400 bg-parchment-100/95 py-4 pl-12 pr-4 text-[15px] font-medium text-navy-700 placeholder-navy-500/60 shadow-inner-soft backdrop-blur-sm transition-all duration-300 focus:border-gold-500 focus:bg-parchment-50 focus:shadow-glow focus:outline-none focus:ring-2 focus:ring-gold-400/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800/95 dark:text-slate-100 dark:placeholder-slate-400/60 dark:focus:border-gold-400 dark:focus:bg-slate-800"
          aria-label="Search for a character"
          spellCheck={false}
          aria-autocomplete="list"
          aria-controls="character-list"
          aria-activedescendant={
            isOpen && results.length > 0
              ? `character-option-${results[selectedIndex].id}`
              : undefined
          }
        />
        {/* Decorative inner border */}
        <div className="pointer-events-none absolute inset-[6px] rounded-xl border border-dashed border-gold-400/30 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />
      </div>

      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          id="character-list"
          role="listbox"
          className="scrollbar-thin bg-parchment-50/98 dark:bg-slate-800/98 absolute z-50 mt-3 max-h-80 w-full overflow-auto rounded-2xl border-2 border-parchment-400/80 py-2 shadow-float backdrop-blur-md dark:border-slate-600/80"
        >
          {results.map((character, index) => (
            <li
              key={character.id}
              id={`character-option-${character.id}`}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(character)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-all duration-200 ${
                index === selectedIndex
                  ? "bg-navy-700 text-white shadow-md dark:bg-slate-600"
                  : "text-navy-700 hover:bg-gold-100/60 hover:pl-5 dark:text-slate-200 dark:hover:bg-slate-700/60"
              }`}
            >
              <div
                aria-hidden="true"
                className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-full shadow-soft transition-all duration-200 ${
                  index === selectedIndex
                    ? "ring-2 ring-gold-400"
                    : "ring-2 ring-parchment-400/70 dark:ring-slate-600/70"
                }`}
              >
                <Image
                  src={character.imageUrl}
                  alt=""
                  fill
                  sizes="40px"
                  quality={90}
                  className="object-cover object-top"
                  onError={(e) => {
                    e.currentTarget.src = "/characters/fallback.svg";
                  }}
                />
              </div>
              <span className="font-semibold tracking-tight">
                {character.name}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.trim().length > 0 && results.length === 0 && (
        <div
          role="status"
          aria-live="polite"
          className="bg-parchment-50/98 dark:bg-slate-800/98 absolute z-50 mt-3 w-full rounded-2xl border-2 border-parchment-400/80 px-4 py-5 text-center shadow-float backdrop-blur-md dark:border-slate-600/80"
        >
          <div className="flex items-center justify-center gap-2 text-navy-600 dark:text-slate-300">
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m1.85-5.15a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
              />
            </svg>
            <span className="text-sm font-medium text-navy-600/80 dark:text-slate-300/80">
              No characters found
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
