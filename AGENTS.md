# Amavie

Amavie is an online clothing store.

This repository is a pnpm monorepo with two standalone Next.js applications. More detailed app-specific notes will live in nested `AGENTS.md` files later.

## Applications

- **`apps/web`** (`@amavie/web`) — customer-facing store. Customers browse products and make purchases. See `apps/web/AGENTS.md` once it exists.
- **`apps/backoffice`** (`@amavie/backoffice`) — admin app for business owners. Used to update content shown in web, review submitted purchases, configure products, send SMS to customers (for example a birthday discount), and similar operations. See `apps/backoffice/AGENTS.md` once it exists.

## Shared packages (`packages/*`)

Both apps depend on these workspace packages:

- **`database`** (`@amavie/database`) — Prisma schema and `createPrismaClient()` for each app to instantiate a Prisma client.
- **`shared`** (`@amavie/shared`) — types, constants, helpers, and React components used by both apps.
- **`eslint-config`**, **`jest-config`**, **`prettier-config`**, **`typescript-config`** — shared config for those tools.

## Assets

`storage/` holds images and other assets used by both applications.

## Tech stack

Next.js, Prisma, PostgreSQL (Docker), pnpm workspaces, shadcn, Tailwind CSS. More tools may be added later.

## Common commands

From the repo root:

- `pnpm dev:w` / `pnpm dev:b` — start web or backoffice
- `pnpm db:up` / `pnpm db:down` — start or stop PostgreSQL
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:studio` / `pnpm db:reset` — Prisma workflows
- `pnpm lint` / `pnpm test` / `pnpm format` — workspace-wide checks
