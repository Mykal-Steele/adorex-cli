# adorex ![npm version](https://img.shields.io/npm/v/adorex-cli?style=flat-square&label=npm&labelColor=6b7280&color=0A84FF)

Quickly scaffold an Express + TypeScript + Prisma + SQLite app.

## Scaffolding Your First Adorex Project

Compatibility note:

- CLI runtime: Node `>=22`
- Generated app support: Node `^22.12 || ^24.0`

With npm:

```bash
npx adorex-cli
```

With pnpm:

```bash
pnpm dlx adorex-cli
```

With yarn:

```bash
yarn dlx adorex-cli
```

Or install globally and use `adorex` directly:

```bash
npm i -g adorex-cli
adorex
```

Then follow the prompts.

You can also provide the project name directly:

```bash
npx adorex-cli my-app
pnpm dlx adorex-cli my-app
yarn dlx adorex-cli my-app
adorex my-app
```

Then follow the next steps:

```bash
cd my-app
npx prisma migrate dev --name init
npm run dev
```

## What You Get

```text
my-app/
  src/
    index.ts
    utils/
      logger.ts
      prisma.ts
  prisma/
    schema.prisma
  prisma.config.ts
  tsconfig.json
  .env
```

## Stack

- Node.js: `^22.12 || ^24.0`
- Express: `^5.2.1`
- TypeScript: `^5.9.2`
- Prisma ORM: `prisma ^7.5.0` + `@prisma/client ^7.5.0`
- SQLite via libsql: `@libsql/client ^0.17.0` + `@prisma/adapter-libsql ^7.5.0`
- Tooling: `tsx ^4.20.5`, `dotenv ^16.4.7`

## Generated App Scripts

- `npm run dev` - start dev server with watch mode
- `npm run typecheck` - run TypeScript checks
- `npm run build` - compile to `dist/`
- `npm run start` - run compiled app
