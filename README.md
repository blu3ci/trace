# Trace

Trace is a Next.js application built with React, Tailwind CSS, Clerk authentication, and Drizzle ORM.

## Prerequisites

- Node.js 20 or newer
- pnpm 9 or newer
- A Clerk application (for authentication)
- A Neon/Postgres database (for persisted data)

## Build and run locally

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create your local environment file:

   ```bash
   cp .env.example .env
   ```

3. Fill in `.env` with your Clerk keys and `DATABASE_URL`.

4. Generate and apply database migrations:

   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

5. Start the development server:

   ```bash
   pnpm dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

## Production build

```bash
pnpm build
pnpm start
```

## Available commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the development server. |
| `pnpm build` | Create an optimized production build. |
| `pnpm start` | Serve the production build. |
| `pnpm lint` | Run ESLint. |
| `pnpm db:generate` | Generate Drizzle migration files. |
| `pnpm db:migrate` | Apply database migrations. |
| `pnpm db:studio` | Open Drizzle Studio. |
