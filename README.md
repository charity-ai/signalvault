# SignalVault

Private, evidence-first intelligence workspace for a YouTube channel: ask what your channel has already taught, browse indexed episodes, map recurring topics, and turn the archive into offers and content opportunities.

Originally prototyped on Manus; this repository is the standalone version with no Manus runtime, auth, or data proxy.

## Stack

- React 19 + Vite + Tailwind (client, `client/`)
- Express + tRPC server (`server/`)
- Drizzle ORM on MySQL-compatible databases (`drizzle/`)
- YouTube Data API v3 for the public Reference channel scan (`server/youtube.ts`)

## Local setup

Requirements: Node.js 22+ and pnpm 10+.

```bash
cp .env.example .env   # fill in DATABASE_URL and YOUTUBE_API_KEY
pnpm install
pnpm test
pnpm check
pnpm dev
```

The Ask, Library, Topics and Opportunities screens run on built-in sample data and need no backend services. The Reference scan needs `YOUTUBE_API_KEY` and `DATABASE_URL`.

## Database

Schema: `drizzle/schema.ts`. Migrations: `drizzle/0000_fast_exodus.sql`, `drizzle/0001_uneven_thanos.sql`.

```bash
pnpm db:push
```

## Production

```bash
pnpm build
pnpm start
```

## Product boundary

The Reference workspace indexes publicly visible channel and video metadata only (no media, audio or private captions) and refreshes/expires records on a 30-day cycle.
