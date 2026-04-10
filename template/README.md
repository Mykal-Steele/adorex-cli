# {{appName}}

A simple Express + TypeScript + Prisma + SQLite starter app.

Scaffolded with {{scaffoldedWith}}.

## Quick start

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

## Database

Update `prisma/schema.prisma` first.
After changing the schema, run:

```bash
npx prisma migrate dev --name <name>
npx prisma generate
```

The generated Prisma client is placed in `src/generated/prisma`.

## Environment

Default `.env` values:

```env
PORT=3000
DATABASE_URL="file:./dev.db"
```
