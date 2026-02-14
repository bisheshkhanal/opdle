import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-parchment-300/40 bg-gradient-to-b from-parchment-50/95 via-parchment-100/90 to-parchment-100/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-8 sm:py-9">
          <h1 className="mb-3 font-display text-3xl font-semibold tracking-tight text-navy-800 md:text-4xl">
            About OnePiecedle
          </h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy-600 underline-offset-2 transition-all hover:text-navy-800 hover:underline"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to game
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-7">
          {/* How to Play */}
          <section className="game-card p-6 sm:p-7">
            <h2 className="mb-5 flex items-center gap-2.5 text-xl font-bold tracking-tight text-navy-800 sm:text-2xl">
              <svg
                className="h-5 w-5 text-gold-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              How to Play
            </h2>
            <ul className="space-y-3.5 text-[15px] text-navy-600">
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-navy-400" />
                Guess the One Piece character in 6 tries
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-navy-400" />
                Each guess reveals clues about the character attributes
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-tile-correct text-xs font-bold text-white">
                  G
                </span>
                <span>
                  <span className="font-semibold text-tile-correct">Green</span>{" "}
                  = Exact match
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-tile-partial text-xs font-bold text-white">
                  Y
                </span>
                <span>
                  <span className="font-semibold text-tile-partial">
                    Yellow
                  </span>{" "}
                  = Partial match (for Haki types - some overlap)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-tile-wrong text-xs font-bold text-white">
                  R
                </span>
                <span>
                  <span className="font-semibold text-tile-wrong">Red</span> =
                  No match
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-tile-wrong text-sm font-bold text-white">
                  ↑
                </span>
                <span>
                  Arrow = The target value is higher or lower (for
                  bounty/height)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-tile-unknown text-xs font-bold text-white">
                  ?
                </span>
                <span>Unknown = Missing data (no comparison possible)</span>
              </li>
            </ul>
          </section>

          {/* Game Modes */}
          <section className="game-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-navy-800">
              <svg
                className="h-5 w-5 text-gold-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Game Modes
            </h2>
            <div className="space-y-4">
              <div className="rounded-xl bg-navy-50 p-4">
                <h3 className="mb-1 font-semibold text-navy-800">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-navy-700 text-xs text-white">
                    D
                  </span>
                  Daily Mode
                </h3>
                <p className="text-sm text-navy-600">
                  A new character every day at midnight UTC. Same answer for
                  everyone worldwide. Build your streak by solving consecutive
                  days!
                </p>
              </div>
              <div className="rounded-xl bg-gold-50 p-4">
                <h3 className="mb-1 font-semibold text-navy-800">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold-600 text-xs text-white">
                    I
                  </span>
                  Infinite Mode
                </h3>
                <p className="text-sm text-navy-600">
                  Practice anytime with randomly selected characters. No
                  streaks, just fun! Click &quot;Play Again&quot; to get a new
                  character instantly.
                </p>
              </div>
            </div>
          </section>

          {/* Categories */}
          <section className="game-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-navy-800">
              <svg
                className="h-5 w-5 text-gold-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              Categories
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { name: "Gender", desc: "Male, Female, or Unknown" },
                {
                  name: "Affiliation",
                  desc: "Pirate crew, organization, or faction",
                },
                {
                  name: "Devil Fruit",
                  desc: "Paramecia, Zoan, Logia, or None",
                },
                {
                  name: "Haki",
                  desc: "Observation (O), Armament (A), Conqueror (C)",
                },
                {
                  name: "Bounty",
                  desc: "Character's current/last known bounty",
                },
                { name: "Height", desc: "In centimeters" },
                { name: "Origin", desc: "Sea or region of origin" },
                { name: "First Arc", desc: "First story arc appearance" },
              ].map((cat) => (
                <div
                  key={cat.name}
                  className="rounded-lg bg-parchment-100 px-3 py-2"
                >
                  <span className="font-semibold text-navy-800">
                    {cat.name}
                  </span>
                  <span className="text-navy-500"> — {cat.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Data Sources */}
          <section className="game-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-navy-800">
              <svg
                className="h-5 w-5 text-gold-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Data Sources
            </h2>
            <p className="text-navy-600">
              Character data is compiled from the{" "}
              <a
                href="https://onepiece.fandom.com/wiki/One_Piece_Wiki"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-navy-700 underline underline-offset-2 transition-colors hover:text-gold-600"
              >
                One Piece Wiki
              </a>
              . Images are hosted externally and are property of their
              respective owners.
            </p>
          </section>

          {/* Disclaimer */}
          <section className="rounded-xl border border-parchment-400 bg-parchment-100 p-6">
            <h2 className="mb-3 text-lg font-bold text-navy-800">Disclaimer</h2>
            <p className="text-sm text-navy-500">
              This is a fan-made game and is not affiliated with, endorsed,
              sponsored, or specifically approved by Eiichiro Oda, Shueisha,
              Toei Animation, or any other official One Piece entity. One Piece
              and all related characters are trademarks of their respective
              owners. This game is created for entertainment and educational
              purposes only.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-parchment-300/40 bg-gradient-to-t from-parchment-100/95 to-parchment-50/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy-600 underline-offset-2 transition-all hover:text-navy-800 hover:underline"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to game
          </Link>
        </div>
      </footer>
    </main>
  );
}
