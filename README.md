# create-adorex

Bootstrap an API-ready backend starter with Express, TypeScript, Prisma, and SQLite through libsql!

> **Node Support:**
> Run the CLI on Node.js 22 or newer.
> Generated apps are validated on Node.js `^22.12 || ^24.0`.

## Usage

You can use npm, pnpm, yarn, bun, or any other package manager that pulls from npm

```bash
npm create adorex
pnpm create adorex
yarn create adorex
bun create adorex
```

If you would like to create the app directly in the dir you are in run
```bash
npm create adorex .
pnpm create adorex .
yarn create adorex .
bun create adorex .
```

Prefer non-interactive usage? Pass a name directly:

```bash
npm create adorex my-app
pnpm create adorex my-app
yarn create adorex my-app
bun create adorex my-app
```

Flags go after `--`:

```bash
npm create adorex@latest my-app -- --template express-sqlite
npm create adorex@latest my-app -- --force    # overwrite existing directory
npm create adorex@latest -- --help
npm create adorex@latest -- --version
```

| Flag                | Description                                     |
| ------------------- | ----------------------------------------------- |
| `--template <name>` | Template to use (default: `express-sqlite`)     |
| `--force`           | Overwrite target directory if it already exists |
| `-v, --version`     | Print version                                   |
| `-h, --help`        | Print help                                      |

## Project Layout

```text
my-app/
  src/
    index.ts
    utils/
      prisma.ts
  prisma/
    schema.prisma
  prisma.config.ts
  tsconfig.json
  .env
```

After generation:

1. Install the dependencies:

```bash
npm install
```

2. Edit `prisma/schema.prisma` to match your app's data model.
   - Add your own models, fields, and relations before you generate the client.

3. Create your first migration:

```bash
npx prisma migrate dev --name init
```

4. Generate Prisma client code:

```bash
npx prisma generate
```

5. Start the dev server:

```bash
npm run dev
```

## Scripts

- `npm run dev` - starts the dev server in watch mode
- `npm run typecheck` - runs TypeScript checks only
- `npm run build` - compiles to `dist/`
- `npm run start` - runs the compiled app

## Environment

Default `.env` values:

```env
PORT=3000
DATABASE_URL="file:./dev.db"
```
## Stack

- Node.js: `^22.12 || ^24.0`
- Express: `^5.2.1`
- TypeScript: `^5.9.2`
- Prisma ORM: `prisma ^7.5.0` and `@prisma/client ^7.5.0`
- SQLite via libsql: `@libsql/client ^0.17.0` and `@prisma/adapter-libsql ^7.5.0`
- Dev tooling: `tsx ^4.20.5` and `dotenv ^16.4.7`


If you enjoyed the package, consider buying me a virtual coffee ☕ @ [buymeacoffee.com](https://buymeacoffee.com/mykalstele4)

<a href="https://buymeacoffee.com/mykalstele4"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" width="150" alt="Buy Me A Coffee"></a>