# {{appName}}

Express + TypeScript + Prisma + SQLite starter app.

Scaffolded with {{scaffoldedWith}}.

## Requirements

- Node `^22.12 || ^24.0`

## Quick start

1. Create your first migration:

```bash
npx prisma migrate dev --name init
```

2. Start the dev server:

```bash
npm run dev
```

## Scripts

- `npm run dev` - start dev server with watch mode
- `npm run typecheck` - run TypeScript checks only
- `npm run build` - compile to `dist/`
- `npm run start` - run compiled app

## Database

Edit `prisma/schema.prisma`, then run:

```bash
npx prisma migrate dev --name <name>
```

Prisma client output goes to `src/generated/prisma`.
Regenerate Prisma client with `npx prisma generate` when needed.

## Environment

Default `.env` values:

```env
PORT=3000
DATABASE_URL="file:./dev.db"
```
