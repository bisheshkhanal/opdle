# OnePiecedle

A Wordle-like guessing game featuring One Piece characters. Guess the mystery character in 6 tries using attribute clues!

## Features

- **Daily Mode**: A new character every day at midnight UTC. Same answer for everyone worldwide. Track your streak!
- **Infinite Mode**: Practice anytime with randomly selected characters. Play as many rounds as you want.
- **Smart Autocomplete**: Search by character name or alias with keyboard navigation
- **Visual Feedback**: Color-coded clues with arrow indicators for numeric comparisons
- **Share Results**: Copy your results as an emoji grid to share with friends
- **Persistent Progress**: Game state saved in localStorage

## Quick Start (PowerShell - Windows)

```powershell
# Navigate to project directory
cd C:\path\to\onepiecedle

# Install dependencies
npm install

# Run development server
npm run dev

# Open in browser
Start-Process "http://localhost:3000"
```

## Available Scripts

```powershell
# Development
npm run dev          # Start development server (http://localhost:3000)

# Production
npm run build        # Build for production
npm start            # Start production server

# Testing
npm test             # Run tests in watch mode
npm test -- --run    # Run tests once
npm run test:coverage # Run tests with coverage report

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check formatting without changes
```

## Game Modes

### Daily Mode
- New character every day at midnight UTC
- Same character for all players worldwide
- Streak tracking (consecutive days solved)
- Share results showing daily game number

### Infinite Mode
- Start a new round anytime with "Play Again"
- Random character each round
- Win/loss statistics tracked
- Share results marked as "Infinite"

## How the Game Works

1. Type a character name in the search box
2. Select from the autocomplete suggestions
3. Each guess reveals clues about the mystery character:
   - **Green**: Exact match
   - **Yellow**: Partial match (for arrays like affiliations, haki types)
   - **Gray**: No match
   - **Red Arrow (↑)**: Target value is higher
   - **Blue Arrow (↓)**: Target value is lower
4. Use the clues to narrow down and guess the correct character
5. You have 6 attempts to find the answer

## Categories

| Category | Type | Description |
|----------|------|-------------|
| Gender | String | Male, Female, or Unknown |
| Affiliation | Array | Pirate crew, organization, or faction |
| Devil Fruit | String | Paramecia, Zoan, Logia, or None |
| Haki | Array | Observation (O), Armament (A), Conqueror (C) |
| Bounty | Number | Current/last known bounty in Berries |
| Height | Number | Height in centimeters |
| Age | Number | Current age or age at death |
| Origin | String | Sea or region of origin |
| First Arc | String | First story arc appearance |

## LocalStorage Keys

The game uses a single localStorage key with schema versioning:

- `onepiecedle_v2`: Main storage key containing:
  - `version`: Schema version for migrations
  - `daily`: Object keyed by date string (YYYY-MM-DD)
    - Each entry contains: guesses, isFinished, isWon, streak, maxStreak
  - `infinite`: Current infinite round state
    - Contains: roundId, seed, guesses, isFinished, isWon, totalWins, totalGames
  - `stats`: Overall statistics

## Adding Characters

Characters are stored in `src/data/characters.v2.json`. To add a new character:

1. Open `src/data/characters.v2.json`
2. Add a new character object following this schema:

```json
{
  "id": "unique-lowercase-id",
  "name": "Full Character Name",
  "aliases": ["Alias1", "Nickname"],
  "imageUrl": "https://example.com/image.png",
  "gender": "Male",
  "affiliation": ["Crew Name"],
  "devilFruit": "Fruit Name" or null,
  "devilFruitType": "Paramecia" | "Zoan" | "Logia" | "None",
  "haki": ["Observation", "Armament", "Conqueror"],
  "bounty": 1000000000,
  "height": 180,
  "age": 30,
  "origin": "East Blue",
  "status": "Alive" | "Deceased" | "Unknown",
  "firstArc": "Arc Name"
}
```

3. Save the file
4. The character will be available after restart

## Customizing Categories

Categories are defined in `src/lib/categories.ts`. To modify:

1. Edit the `categories` array
2. Each category has:
   - `key`: Property name on Character type
   - `label`: Display name
   - `type`: "string", "array", or "number"
   - `renderValue`: Function to format the display value
   - `evaluate`: Function to compare guess vs target

## Project Structure

```
onepiecedle/
├── src/
│   ├── app/
│   │   ├── about/
│   │   │   └── page.tsx          # About page
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Main game page
│   ├── components/
│   │   ├── Autocomplete.tsx      # Character search
│   │   ├── AnswerReveal.tsx      # End game reveal
│   │   ├── GuessRow.tsx          # Guess display
│   │   ├── ModeTabs.tsx          # Daily/Infinite tabs
│   │   └── ResultsShare.tsx      # Share button
│   ├── data/
│   │   └── characters.v2.json    # Character database
│   ├── lib/
│   │   ├── __tests__/            # Unit tests
│   │   ├── categories.ts         # Category config
│   │   ├── daily.ts              # Daily mode logic
│   │   ├── evaluateGuess.ts      # Guess comparison
│   │   ├── infinite.ts           # Infinite mode logic
│   │   ├── search.ts             # Character search
│   │   ├── share.ts              # Share formatting
│   │   ├── storage.ts            # localStorage
│   │   └── types.ts              # TypeScript types
│   └── test/
│       └── setup.ts              # Test setup
├── public/
│   └── characters/               # Character images
├── scripts/
│   └── download-images.py        # Image download tool
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier

## Development Notes

- All selection logic runs client-side (no backend required for MVP)
- Character images stored locally in `public/characters/` (use `npm run setup:images` to download)
- Daily character selection is deterministic based on UTC date
- Infinite mode uses seeded PRNG for reproducible selections

## License

This is a fan-made project for educational purposes. One Piece and all related characters are trademarks of their respective owners.
