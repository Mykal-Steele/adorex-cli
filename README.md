# adorex

Simple CLI to scaffold an Express + TypeScript + Prisma + SQLite app.

CLI runtime: Node `>=22`.
Generated apps are tested with Node `^22.12 || ^24.0`.

## Usage

```bash
npx adorex-cli <project-name>
cd project-name
npx prisma migrate dev --name init
npm run dev
```

If you install the package globally with `npm install -g adorex-cli`, the command is `adorex <project-name>`.

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

- `npm run dev` - dev server with hot reload
- `npm run typecheck` - type check only
- `npm run build` - compile TypeScript to `dist/`
- `npm run start` - run compiled output

## Stack

- Express 5
- TypeScript
- Prisma 7.5 with libsql adapter
- SQLite
