# adorex [![npm package](https://img.shields.io/npm/v/adorex-cli)](https://www.npmjs.com/package/adorex-cli)

Bootstrap an API-ready backend starter with Express, TypeScript, Prisma, and SQLite through libsql!

## Start an Adorex Project

> **Node Support:**
> Run the CLI on Node.js 22 or newer.
> Generated apps are validated on Node.js `^22.12 || ^24.0`.

With NPM:

```bash
npx adorex-cli
```

With Yarn:

```bash
yarn dlx adorex-cli
```

With PNPM:

```bash
pnpm dlx adorex-cli
```

Or install once and run globally:

```bash
npm i -g adorex-cli
adorex
```

The CLI will guide you through setup.

Prefer non-interactive usage? Pass a name directly:

```bash
npx adorex-cli my-app
yarn dlx adorex-cli my-app
pnpm dlx adorex-cli my-app
adorex my-app
```

## Project Layout

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

After generation:

```bash
cd my-app
npx prisma migrate dev --name init
npm run dev
```

## Stack

- Node.js: `^22.12 || ^24.0`
- Express: `^5.2.1`
- TypeScript: `^5.9.2`
- Prisma ORM: `prisma ^7.5.0` and `@prisma/client ^7.5.0`
- SQLite via libsql: `@libsql/client ^0.17.0` and `@prisma/adapter-libsql ^7.5.0`
- Dev tooling: `tsx ^4.20.5` and `dotenv ^16.4.7`

## Generated App Scripts

- `npm run dev` - run the server with watch mode
- `npm run typecheck` - run static type checks
- `npm run build` - compile output into `dist/`
- `npm run start` - run the production build


If you enjoyed the package, consider buying me a virtual coffee ☕ @ [buymeacoffee.com](https://buymeacoffee.com/mykalstele4) 

<a href="https://buymeacoffee.com/mykalstele4"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" width="150" alt="Buy Me A Coffee"></a>
