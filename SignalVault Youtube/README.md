# SignalVault Source Code

This is a **sanitized developer-ready source export** of the SignalVault web application published at `https://signalvault-adbuxjxx.manus.space`.

## What is included

- React + TypeScript user interface
- Express + tRPC server application
- Drizzle database schema and both SQL migrations
- SignalVault public YouTube Reference ingestion pipeline
- Metadata chunking, retention, retrieval, and source-linking logic
- Automated Vitest coverage for the private prototype and Reference pipeline
- Package manifest, lockfile, TypeScript, Vite, and Vitest configuration

## Security note

This export intentionally excludes:

- Deployment configuration and host-issued credentials
- API keys, OAuth secrets, database credentials, and session secrets
- `node_modules`, build artifacts, logs, and local cache files

Create your own environment configuration before running the application. The project expects platform-provided values such as `DATABASE_URL`, `JWT_SECRET`, `BUILT_IN_FORGE_API_URL`, and `BUILT_IN_FORGE_API_KEY`. For an independent deployment, replace the built-in YouTube Data API adapter with your own authenticated data provider or YouTube API implementation.

## Local setup

Requirements: Node.js 22+ and pnpm 10+.

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm check
pnpm build
pnpm dev
```

## Database

The database model is defined in `drizzle/schema.ts`. SQL migrations are in `drizzle/`:

- `0000_fast_exodus.sql` — initial application schema
- `0001_uneven_thanos.sql` — public Reference channels, videos, chunks, board items, TTL fields, and indexes

Apply migrations with your chosen MySQL/TiDB workflow after setting `DATABASE_URL`.

## Production commands

```bash
pnpm build
pnpm start
```

## Product boundary

The public Reference workspace indexes **publicly visible channel and video metadata**. It does not copy media files, audio, or private captions, and it labels metadata search results accordingly. Reference records use a 30-day refresh/expiry model.

## Git status at export

At the time of export, this project is in a managed WebDev Git repository and is **not connected to GitHub**. Create a private GitHub repository before pushing this source package.
