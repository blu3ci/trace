# trace

trace is a Next.js application built with React, Tailwind CSS, Clerk authentication, and Drizzle ORM.

## Table of Contents

1. [Prerequisites](#prerequisites)
1. [Install pnpm](#install-pnpm)
1. [Build and run locally](#build-and-run-locally)
1. [Production build](#production-build)
1. [Available commands](#available-commands)
1. [How we used Codex](#how-we-used-codex)

## Prerequisites

- Node.js 20 or newer
- pnpm 9 or newer
- A Clerk application (for authentication)
- A Neon/Postgres database (for persisted data)

## Install pnpm

If pnpm is not already installed, install the version used by this project with npm:

```bash
npm install --global pnpm@latest
```

Confirm the installation:

```bash
pnpm --version
```

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

| Command            | Purpose                               |
| ------------------ | ------------------------------------- |
| `pnpm dev`         | Run the development server.           |
| `pnpm build`       | Create an optimized production build. |
| `pnpm start`       | Serve the production build.           |
| `pnpm lint`        | Run ESLint.                           |
| `pnpm db:generate` | Generate Drizzle migration files.     |
| `pnpm db:migrate`  | Apply database migrations.            |
| `pnpm db:studio`   | Open Drizzle Studio.                  |

## How we used Codex and GPT-5.6
Codex and GPT-5.6 Terra were used for most of the tasks in this project due to its high intelligence and the fact that we could not get access to GPT-5.6 Sol for this project.

On the frontend, Codex was used extensively. We had Codex develop a unique UI style for our application to maintain consistency. It chose a special shade of green (`#315943`) to use throughout our app and helped keep our UI components consistent and reusable by moving them into the `/components` folder, as specified in AGENTS.md. Codex was also used to style the document editor and to write code to ensure its behavior was similar to Google Docs, which is very important since users will need to migrate to our service to write their essay, so we want the editor to feel familiar. Codex was very useful when it came to trying new things. For example, Clerk, Next.js, and the OpenAI API were new to most of the people on the team. Thanks to Codex and its seamless integration with agent skills, all we had to do was install the skills for each of these tools, and now Codex was a certified expert. With Clerk, it was able to ensure that it was writing up-to-date and secure authentication code with rule-based access control logic that separates teachers from students in our app. With its skills in Next.js, it was able to easily integrate the OpenAI API into our app whilst following all of the best practices for Next.js to ensure that our app stays performant even with numerous AI-summarizations being queued and created, and created a rate-limiting system that resets every 10 minutes to ensure no one abuses the AI-summarization feature. It even generated an OpenAI API key for us, saving us from any manual configuration on the API dashboard. Codex's intelligence especially shines when it was writing the Drizzle code to interact with our database. Since Drizzle is a fairly new ORM, there are no official skills for it yet. However, a link to its documentation in the `AGENTS.md` file was all that was needed to ensure it could write safe, performant database queries with little to no human involvement. It was also able to ensure that our migrations did not fail during testing by setting certain fields as nullable, thus making our application development experience extremely smooth, even the largest of database additions, like when it came to introducing rule-based access control for the first time or making big changes to the assignment receipts to introduce AI-summarization. It was also able to switch our codebase from the old Drizzle relations API to the newer `defineRelations` API without a `skills.md` to reference (only the documentation link in `AGENTS.md`).



