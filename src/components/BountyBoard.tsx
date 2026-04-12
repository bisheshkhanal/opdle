"use client";

import React from "react";
import Image from "next/image";
import { Character } from "@/lib/types";
import { getLocalCharacterImageUrl } from "@/lib/images";

interface BountyBoardProps {
  characters: Character[];
  discoveredIds: string[];
}

export function BountyBoard({ characters, discoveredIds }: BountyBoardProps) {
  const discoveredSet = new Set(discoveredIds);

  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
      {characters.map((char) => {
        const isDiscovered = discoveredSet.has(char.id);
        const imageUrl = getLocalCharacterImageUrl(char.id);

        return (
          <div
            key={char.id}
            className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all duration-200 ${
              isDiscovered
                ? "border-gold-500 shadow-sm hover:z-10 hover:scale-105 hover:shadow-md"
                : "border-navy-300/30 opacity-70 dark:border-navy-700/50"
            }`}
            title={isDiscovered ? char.name : undefined}
          >
            <Image
              src={imageUrl}
              alt={isDiscovered ? char.name : "Unknown Character"}
              fill
              sizes="(max-width: 640px) 25vw, (max-width: 768px) 16vw, 12vw"
              className={`object-cover object-top ${
                !isDiscovered ? "brightness-0 grayscale" : ""
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
