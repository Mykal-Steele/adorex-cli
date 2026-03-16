# Adorex App

Express + TypeScript + Prisma + SQLite

## Node support

This project is tested with Node `^20.19 || ^22.12 || ^24.0`.
If you run a different Node version and hit issues, switch to one of those LTS versions.

## Setup

After creating the project, run your first migration:

```
npx prisma migrate dev --name init
```

Then start the dev server:

```
npm run dev
```

## Scripts

- `npm run dev` - dev server with hot reload
- `npm run typecheck` - run TypeScript checks without emitting files
- `npm run build` - compile TypeScript
- `npm run start` - run compiled build
- `npm run prisma:generate` - regenerate the Prisma client
- `npm run prisma:migrate -- --name <name>` - create and apply a development migration

## Database

Edit schema in `prisma/schema.prisma`, then migrate:

```
npx prisma migrate dev --name <name>
```
The generated Prisma client is written to `src/generated/prisma`.

## Environment

Defaults are in `.env`:

```
PORT=3000
DATABASE_URL="file:./dev.db"
```

Database connection and migrations are configured in `prisma.config.ts`, which reads `DATABASE_URL` from the environment.
