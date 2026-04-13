# Learnings

## Session Context
- Plan: 4-5-social-platform-and-data (combined Social/Virality + Platform/Data)
- 36 total tasks across 7 waves + final verification
- Cross-plan dependency: NONE (S and P tasks are independent of each other)

## Project Conventions
- Path alias `@/*` → `src/*`
- Prettier: double quotes, 2-space indent, semicolons, trailing commas (es5)
- Vitest config in `vite.config.ts` (NOT vitest.config.ts)
- Test files: `*.test.ts(x)` only — `.spec.ts` is excluded
- Dark mode: Tailwind `darkMode: "class"`
- Three.js components: ALWAYS `dynamic(() => import(...), { ssr: false })`
- Custom Tailwind tokens: tile-*, parchment-*, navy-*, gold-*

## Known Gotchas
- `migrateStorage` is a placeholder that resets to default
- `hash = hash & hash` in dateToSeed/roundIdToSeed is intentional (32-bit coercion) — LEAVE AS-IS
- BUG in search.test.ts: punctuation-only query matches everything (known, unfixed)
- DO NOT fix pre-existing test failures unless explicitly tasked
- DO NOT use `as any` or `@ts-ignore`

## Service Worker Notes
- Root-scoped SW lives at `public/sw.js`; registration is triggered from the client-only `Providers` wrapper.
- Cache names are versioned explicitly (`onepiecedle-static-v1`, `onepiecedle-shell-v1`) so old versions can be deleted on activate.
- The worker keeps `/api/auth/*`, `/api/stats/*`, and `/profile/*` off cache paths; static assets stay cache-first while API routes remain network-only.
- App shell pre-caching stores `/` in the shell cache and discovered `/_next/static/*` assets in the static cache.

## Social Contract Decisions
- Canonical social DTOs now live in `src/lib/types.ts` and `src/lib/validators.ts` for share cards, factions, weekly rankings, challenges, and daily comparison payloads.
- UTC week windows are defined as ISO weeks starting Monday 00:00:00Z.
- Competitive records are authenticated-only and must carry immutable faction snapshots so later profile changes do not rewrite historical results.
- Ranking order is: points desc, avg guesses asc, participant count desc, then alphabetical tie-breaker.
- Percentile fields use `PERCENT_RANK` semantics on a 0-100 inclusive scale.
- Challenge streaks count consecutive solved challenges and skips do not break the streak.
- Public profile surface includes faction membership and challenge summary visibility; share cards always require a text fallback.

## [S7] Faction APIs
- Keep faction display metadata in one shared helper so the write route, weekly board, and enhanced public leaderboard all render the same names/slugs.
- When validating query params for cacheable GET routes, build the object explicitly and pass default strings for optional numbers before calling Zod; that avoids undefined coercion edge cases.
- The public leaderboard should only join faction membership data when the enhanced view is requested so the default response stays stable and backwards-compatible.
- Weekly faction ordering is easiest to verify by testing all four sort keys together: points, average guesses, participant count, then faction name.

## PWA Manifest Notes
- Next.js App Router supports `src/app/manifest.ts` exporting `MetadataRoute.Manifest` for `/manifest.webmanifest`
- Root layout metadata can point at the manifest with `metadata.manifest`
- Installable PWA icons should be served from `public/` and referenced at `192x192` and `512x512`
- For OnePiecedle, the app palette maps cleanly to `navy-900` (`#08101D`) and `gold-500` (`#D4A520`)

## [S14] Auth Hardening
- Bulk stats sync now stays on the vanity boundary: authenticated users can upsert daily/infinite stats, but extra progression metadata is ignored rather than promoted into server history.
- `useAuthSync()` now checks both `status === "authenticated"` and a concrete `session.user.id` before posting either bulk syncs or per-game daily results.
- The daily-result route’s auth gate remains ahead of JSON parsing, so unauthenticated requests fail fast even with malformed bodies.
- Duplicate stats syncs are still merged with `GREATEST(...)` conflict updates, which keeps retries idempotent without inventing new history.

## [S12] Profile API Expansion
- Public profile summaries should be projected from read-only tables and summarized counts, not from internal challenge identifiers or invite metadata.
- Faction profile data is best split into identity plus current-week contribution, with `joinedAt` surfaced as the public `memberSince` timestamp.
- Challenge streaks can be derived safely from ordered public attempt rows, while pack completion counts stay public by comparing solved challenge IDs against pack entries.

## [S15] Faction E2E Coverage
- `How to Play` can open by default on first-load and blocks header icon clicks (`Leaderboard` / `Challenges`), so the E2E suite needs an explicit close step before interacting with header actions.
- The social/faction coverage is more stable when API responses are mocked in-browser for leaderboard/challenges endpoints, because DB-backed routes can be unavailable in local runs while UI behavior still needs deterministic verification.
- `/profile/[username]` uses a server-side fetch to `NEXTAUTH_URL` fallback (`localhost:3000`), so profile fallback coverage in port-3001 E2E is reliable only when a lightweight local profile API responder is available on 3000.
- For challenges modal assertions, scope tab selectors inside `getByRole("dialog", { name: "Challenges" })` to avoid collisions with the header `Leaderboard` icon button.

## Push Reminder Schema Notes
- `getTableConfig(table).indexes` is the useful introspection hook for Drizzle unique indexes in this repo/version; `uniqueConstraints` stayed empty for the new tables.
- Zod 4.3.x supports `z.url()`, `z.base64()`, and `z.uuid()` for the push payload validators without extra helpers.
- `lsp_diagnostics` surfaced only existing `pgTable` deprecation hints in `schema.ts`; no new errors were introduced by the reminder tables.

## Settings Expansion (P4)
- When expanding `UserSettings` with nested objects (like `installPrompt`), spreading `...DEFAULT_SETTINGS, ...parsed` only performs a shallow merge. A deep merge or manual check (e.g., `parsed.installPrompt`) is necessary in `loadSettings()` to ensure missing nested keys in legacy local storage get properly hydrated with defaults.
- Setting keys used in `SettingsModal.tsx` should be explicitly typed instead of using `keyof UserSettings` if the settings object contains non-boolean values.

## Character Schema Enrichment (P11)
- Keep the runtime `Character` schema code-first: required gameplay fields stay required, while enrichment fields like `age`, `status`, `crewHistory`, `epithet`, `quotesOrLaughs`, and `provenance` are optional and validated only when present.
- Dataset tests should probe optional-field validity with crafted samples instead of requiring a full backfill in `characters.v2.json`.
- README schema examples need to separate required fields from optional enrichment fields to avoid implying backfill is mandatory.

## Scraper Enrichment (P12)
- Standalone scripts under `scripts/` need to be included in the root `tsconfig.json` for TypeScript/LSP alias resolution when they import `@/lib/*` types.
- If `next build` fails while collecting page data with a missing `.next/server/pages-manifest.json`, clearing `.next/` and rebuilding can fix a stale cache artifact without changing source code.

## Social Validator Contracts (S3)
- Shared social validators should stay in `src/lib/validators.ts` as named exports so route handlers can reuse one contract surface for both reads and mutations.
- Query-param booleans need explicit string preprocessing (`"true"`/`"false"`) because URLSearchParams arrives as strings, not booleans.
- `weekKey` needs more than a regex; the schema should also bound the ISO week number so values like `2026-W99` fail early.
- Mutation helpers should fail fast with `Unauthorized` before parsing payloads so anonymous callers never reach downstream handler logic.

## Social/Challenge Schema Expansion (S2)
- Drizzle `pgEnum` works cleanly for shared challenge states and faction slugs; reusing the same enum across multiple tables keeps insert/select shapes aligned.
- `getTableConfig(table).indexes` is the reliable way to verify named unique indexes in schema tests; the new in-memory attempt test enforces duplicate `challengeId + userId` behavior without a DB.
- Immutable submit-time faction data should be stored as a plain varchar snapshot on attempt rows so later membership changes do not rewrite history.
- Weekly aggregate rows can enforce ISO week keys with a simple SQL `CHECK` plus a fixed `varchar(8)` column.

## [P14] Enrichment Batch B
- Keep `crewHistory` limited to documented affiliation changes; the runtime validator only checks shape, so the dataset tests need to enforce sane per-entry structure and non-empty crew names.
- Real bounty progression should end on the current bounty and stay strictly increasing; a small set of high-confidence Straw Hat characters is enough to backfill the batch without inventing missing canon.
- `quotesOrLaughs` is safe as enrichment-only metadata when tests explicitly prove it does not change `evaluateCharacter()` output or appear in the gameplay category list.

## Reminder Client Flow (P7)
- Browser notification permission and active push subscription are separate states; the UI should derive its switch from both, not from the saved `notificationsOptIn` flag alone.
- `Notification.requestPermission()` must stay inside the explicit click handler so the browser prompt still counts as a user gesture.
- For tests, stubbing `window.Notification` and `navigator.serviceWorker.ready` is enough to cover the full subscribe flow without touching real browser APIs.

## [P8] Push Subscription API
- Auth checks should happen before JSON parsing for write routes so anonymous requests fail fast with 401.
- Endpoint uniqueness makes POST naturally idempotent: upsert on endpoint, then list only `appOptIn = true` rows for the current user.
- Vitest route tests stayed simple by mocking Drizzle helpers (`eq`/`and`) plus a tiny in-memory store, which made duplicate-endpoint behavior observable without a real DB.

## Share Card Rendering (S5)
- The share-card payload builder should stay pure by deriving `puzzleLabel`, `guessCount`, and `emojiGrid` directly from inputs; using `formatShareText()` for `textFallback` keeps the clipboard path identical to the existing share flow.
- The OG route works cleanly with `next/og` on the edge runtime as long as it returns an `ImageResponse` with explicit cache headers and a safe fallback when `imageUrl` is missing.
- A clean `rm -rf .next && npm run build` was needed after an interrupted build; the stale output had left `next-font-manifest.json` missing during export.

### Install Prompt Implementation
- Added `InstallPrompt` to show "Add to Home Screen" on Web via `beforeinstallprompt` event.
- For iOS where `beforeinstallprompt` isn't available, we detect user-agent and show an instructional prompt explaining to use the share menu.
- Integrated `UserSettings` dynamically into `page.tsx` on first load, incrementing `completedDailiesCount` upon transitions of `isWon` going to true. 
- Created `InstallPrompt.test.tsx` verifying component hiding/showing and the correct handling of `beforeinstallprompt` method execution (userChoice.outcome).

## Offline Infinite Mode (P3)
- The service worker now needs a separate data cache marker (`/__sw-data-version__`) so a `SW_DATA_VERSION` bump can clear stale character data without renaming the whole cache.
- Character images are better handled with stale-while-revalidate in their own cache; the static shell cache can still hold initial copies, but runtime fetches should refresh into `onepiecedle-images-v1`.
- A dedicated `/api/characters` route makes SW pre-caching predictable and also gives the client a stable JSON source for offline-friendly infinite mode.

## [S4] Faction & Challenge Service Layer
- Keep faction rankings pure by aggregating immutable competitive facts first, then sorting with the shared contract order: points desc, avg guesses asc, participant count desc, alphabetical.
- UTC week bucketing should normalize to Monday 00:00:00Z and emit both `weekStartUtc` / `weekEndUtc` for downstream projections.
- Challenge history projections should synthesize skipped rows from missing attempts; skips carry the existing streak forward and do not break it.
- Pack progression is easiest to keep deterministic when it derives from projected history rows rather than from live membership state.
- `next build` still fails on the pre-existing `/api/challenges/packs` prerender query because it tries to hit the database during export; that is outside this service work.

## [S10] Challenge APIs
- The tracked challenge API works best when `GET /api/challenges` handles both empty history and `challengeId`-scoped detail/history in one auth-gated query path.
- `challengeCreationSchema` maps cleanly to server-issued challenge IDs when the route derives a slug server-side and stores the tier as an internal numeric level.
- Duplicate competitive submissions should surface as 409 from the insert `returning()` path; expired challenges should fail earlier with 410 before any write is attempted.
- Public pack and leaderboard reads can stay unauthenticated, while pack progress can be derived from the authenticated user’s attempts filtered against the pack’s challenge IDs.
- Vitest route tests here were easiest to maintain with a shared select/insert chain helper plus `vi.doMock()` before dynamic imports.

## [P13] Enrichment Batch A
- For roster backfills, keep enrichment fields strictly optional and only add canon-safe values; `status` can be `Unknown` when the story does not settle the character’s fate.
- Alias cleanup should normalize wrapper quotes only; preserve legitimate internal quotes and keep the data/tests focused on artifact patterns like pipes, semicolons, and adjacent quotes.
- Threshold-based roster assertions are safer than exact counts once the dataset starts accumulating enrichment-only edits.

## [P15] Staged Roster Expansion Publish Workflow
- Data growth tests should enforce a baseline floor (`>= 231`) instead of an exact count so intentional staged additions do not cause false negatives.
- A dry-run publish script is safer than direct writes: load incoming candidates, derive staged additions by id diff, validate with `validateCharacter()`, and emit warnings without mutating `characters.v2.json`.
- Image readiness should be reported against runtime expectations (`public/characters/{id}.png`) using ids from the dataset and staged additions.
- Incoming payloads can safely normalize to `/characters/{id}.png` in reporting, but the report should still surface non-standard incoming image URLs for auditability.
- Provenance completeness should be reported separately from schema validity so enrichment can remain optional while still tracking metadata quality over time.

## [P10] SW Push Handling
- Validate push payloads before notification rendering; parse JSON from `event.data.text()` and drop malformed or shape-missing payloads with a warning.
- Normalize notification deep links against `self.location.origin` so relative URLs survive the push -> click round trip.
- `clients.matchAll({ type: "window", includeUncontrolled: true })` is enough to avoid duplicate tabs; focus the first available window client before calling `openWindow()`.
- The worker logic is easier to test when the shared helper module exports the push/click handlers and URL normalization, while `public/sw.js` mirrors the same runtime behavior.

## [S6] Daily Comparison Analytics
- Keep daily comparison analytics pure and fixture-driven: the service should aggregate immutable facts, not touch the DB, so percentile/rank logic stays easy to test.
- Guess distributions are 6 buckets for wins only (`1..6`), while losses still count toward sample size and can leave rank/percentile null.
- Trend summaries should be windowed by UTC date and can safely emit zero-filled days for missing history.

## S8: Share Card UI Integration
- When testing clipboard behavior in JSDOM, `navigator.clipboard` and `ClipboardItem` need to be explicitly mocked.
- Native `navigator.share` can only be tested with specific environments, but handling fallback to `navigator.clipboard.write([new ClipboardItem(...)])` is a robust way to share generated image blobs on desktop browsers.
- Generating images via Next.js `/og` routes allows client components to defer heavy canvas rendering to the edge, returning a simple blob for the client to share.
- `ResultsShare` manages its own loading/success/error states to ensure it doesn't block the rest of the game completion UI.

### Faction UI Implementation (S9)
- **Profile Display**: Added `factionSlug` join to `users` -> `factionMemberships` in `src/app/api/profile/[username]/route.ts`. The UI uses `getFactionBySlug` to derive proper casing and emojis. Unaffiliated users fallback to a generic placeholder.
- **Leaderboard Faction Support**: When passing `includeFaction=true` to the standard leaderboard API, it joins `factionMemberships` per user. We map this back to `factionSlug`, `factionName`, and custom emojis dynamically on the client.
- **Faction-vs-Faction View**: Implemented a top-level "Individual / Factions" toggle. It calls `/api/factions/leaderboard` mapping rows using `FACTIONS` helper.
- **Testing Gotchas**: Modifying profile API requires explicitly mocking `factionMemberships: {}` in the `vi.mock("@/lib/db/schema")` stub.

## P9 Reminder Dispatch
- Reminder eligibility stays pure when it only needs user/subscription state plus same-day completion rows; the dedupe check is cleaner in the dispatch layer because the audit table already owns the one-per-user/tier/day guarantee.
- Late-week timing works best as a preference flag (`requireLateWeek`) rather than a hard blocker, so the same helper can support cron scheduling and manual backfills.
- For cron-safe dispatch, choose one active subscription per user, then write a `reminder_audit` row with `onConflictDoNothing()` so reruns stay idempotent.
- Deep links can stay simple: the root app URL with `?mode=daily&tier=...&date=...` is enough for the reminder payload and keeps the base URL configurable.

### Task S11: Challenge UI Surfaces
- Integrated tracked Challenge UI without disrupting the lightweight URL `?challenge=` flow. 
- Created a `ChallengesModal` with `Packs`, `History & Streaks`, and `Leaderboard` tabs to cleanly separate the new tracked challenges from the `Leaderboard` component which handles daily/infinite modes.
- Utilized the `useGameUiState` to seamlessly hook the `ChallengesModal` visibility into the existing `GameModalRegistry` and header patterns, maintaining application state consistency.
- Maintained user access patterns by introducing an explicit unauthenticated state with a "Sign In" prompt inside the modal, ensuring unauthenticated users understand the value of tracked challenges without silent failures.

## [S13] DailyComparison UI Upgrade
- Upgraded `src/app/api/daily-results/route.ts` to return the full `DailyComparisonAnalyticsResult` using `buildDailyComparisonAnalytics`.
- Included a left join with `factionMemberships` to provide faction data when available.
- Updated `DailyComparison.tsx` to show global stats, rank/percentile messaging, a guess distribution chart with highlight on the user's bucket, a faction comparison row, and a historical trend chart.
- Ensured graceful fallback when the user is anonymous or the sample size is under 5.
- Wrote tests to ensure components behave correctly under various states (anon, low sample, full data).
- Validated tests passed locally without affecting unrelated suites.
