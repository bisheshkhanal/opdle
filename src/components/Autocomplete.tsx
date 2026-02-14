"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  const availableCharacters = characters.filter(
    (c) => !guessedIds.includes(c.id)
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
      setIsOpen(matches.length > 0);
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
        selectedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, isOpen]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative group">
        {/* Search icon with gold accent on focus */}
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-600 transition-colors duration-200 group-focus-within:text-gold-500"
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
          className="w-full rounded-2xl border-2 border-parchment-400 bg-parchment-100/95 py-4 pl-12 pr-4 text-[15px] font-medium text-navy-700 placeholder-navy-500/60 shadow-inner-soft backdrop-blur-sm transition-all duration-300 focus:border-gold-500 focus:bg-parchment-50 focus:shadow-glow focus:outline-none focus:ring-2 focus:ring-gold-400/40 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Search for a character"
          spellCheck={false}
          aria-autocomplete="list"
          aria-controls="character-list"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(253,248,240,0.95) 0%, rgba(240,228,209,0.9) 100%)",
          }}
        />
        {/* Decorative inner border */}
        <div className="pointer-events-none absolute inset-[6px] rounded-xl border border-dashed border-gold-400/30 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />
      </div>

      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          id="character-list"
          role="listbox"
          className="scrollbar-thin absolute z-50 mt-3 max-h-80 w-full overflow-auto rounded-2xl border-2 border-parchment-400/80 bg-parchment-50/98 py-2 shadow-float backdrop-blur-md"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(253,248,240,0.98) 0%, rgba(249,240,227,0.98) 100%)",
          }}
        >
          {results.map((character, index) => (
            <li
              key={character.id}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(character)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-all duration-200 ${
                index === selectedIndex
                  ? "bg-navy-700 text-white shadow-md"
                  : "text-navy-700 hover:bg-gold-100/60 hover:pl-5"
              }`}
            >
              <img
                src={character.imageUrl}
                alt=""
                aria-hidden="true"
                className={`h-10 w-10 rounded-full object-cover object-top shadow-soft transition-all duration-200 ${
                  index === selectedIndex
                    ? "ring-2 ring-gold-400"
                    : "ring-2 ring-parchment-400/70"
                }`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/40?text=?";
                }}
              />
              <span className="font-semibold tracking-tight">
                {character.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
