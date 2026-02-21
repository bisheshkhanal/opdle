import type { Metadata, Viewport } from "next";
import { Alegreya, DM_Sans, Pirata_One } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

const alegreya = Alegreya({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-alegreya",
  weight: ["400", "500", "600", "700"],
});

const pirataOne = Pirata_One({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pirate",
  weight: "400",
});

export const metadata: Metadata = {
  title: "OnePiecedle - One Piece Character Guessing Game",
  description:
    "Guess the One Piece character! A Wordle-inspired daily challenge with infinite mode. Test your knowledge of the Straw Hat crew and beyond.",
  keywords: [
    "One Piece",
    "Wordle",
    "Game",
    "Anime",
    "Manga",
    "Guess",
    "Daily Puzzle",
  ],
  authors: [{ name: "OnePiecedle" }],
  openGraph: {
    title: "OnePiecedle",
    description: "Guess the One Piece character in 6 tries!",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15294A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${alegreya.variable} ${pirataOne.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var stored = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var theme = stored || (prefersDark ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
