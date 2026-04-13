import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OnePiecedle",
    short_name: "OnePiecedle",
    description: "Guess the One Piece character in 6 tries.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#08101D",
    theme_color: "#D4A520",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
