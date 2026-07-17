<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# Project conventions

- Use `pnpm` as the default package manager for installing dependencies and running package scripts.
- Use shadcn/ui components whenever they fit the interface; install needed shadcn components instead of recreating their primitives.
- Place reusable components in `src/components/`, not inside route or feature directories.
- Build application forms with React Hook Form and Yup validation. Place all Yup form schemas in `src/formSchemas/`, never inline with the form component.
- Write commit messages using the Conventional Commits format, for example: `feat: add dashboard`.
- Always run `pnpm lint` and `pnpm test` before committing. If either command is unavailable or fails, report it before creating the commit.
- When changing the database schema, generate and include the corresponding Drizzle migration with `pnpm db:generate`.
- Define database relations in `src/db/relations.ts`, not alongside table definitions or feature code.
- This project uses the latest `1.0.0-rc` release of Drizzle. Write and update Drizzle code according to the latest patterns in the official documentation: https://orm.drizzle.team/docs/
- Keep changes scoped to the request; do not overwrite or stage unrelated work already present in the repository.
- Run focused type checks and relevant tests after implementation, and report any pre-existing warnings separately from new failures.
