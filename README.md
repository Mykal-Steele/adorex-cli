# adorex

Scaffold an Express + TypeScript + Prisma + SQLite project in seconds.

Generated apps target Prisma's supported Node.js versions: `^20.19 || ^22.12 || ^24.0`.

## Usage

```
npx adorex-cli <project-name>
cd project-name
npx prisma migrate dev --name init
npm run dev
```

If you install the package globally with `npm install -g adorex-cli`, the command is `adorex <project-name>`.

## Development

- `npm test` - verify the CLI still creates the expected project files

## What you get

```
my-app/
  src/
    index.ts          # Express server
    utils/prisma.ts   # Prisma client with libsql adapter
    generated/        # Prisma generated client (after generate)
  prisma/
    schema.prisma     # Database schema
  prisma.config.ts    # Prisma 7.5 config (loads .env)
  tsconfig.json
  .env                # PORT=3000, DATABASE_URL=file:./dev.db
```

## Scripts

- `npm run dev` — dev server with hot reload (tsx watch)
- `npm run typecheck` — type check without emitting files
- `npm run build` — compile TypeScript to `dist/`
- `npm run start` — run compiled output (`dist/index.js`)
- `npm run prisma:generate` — regenerate the Prisma client
- `npm run prisma:migrate -- --name <name>` — create and apply a migration

## Stack

- Express 5
- TypeScript
- Prisma 7.5 with libsql adapter
- SQLite
