# Mise

Mise is a TypeScript recipe manager organized as a pnpm monorepo and modeled after TaskBook's stack.

## Stack

- **API:** Hono, Zod, Mongoose/MongoDB, and Pino
- **Web:** Lit, Vite, and Phosphor Icons
- **Shared contracts:** Zod schemas with inferred TypeScript types
- **Tooling:** TypeScript, pnpm, and Vitest

## Workspaces

```text
apps/api/           @mise/api
apps/web/           @mise/web
packages/contracts/ @mise/contracts
docs/design/        Approved visual and brand references
```

## Development

Requires Node.js 22+, pnpm 10+, and access to the configured MongoDB server.

```bash
pnpm install
pnpm dev
```

The web app runs at `http://localhost:5173` and proxies API calls to `http://localhost:3000`. Copy `.env.example` to `.env` in the repository root to customize configuration. The API resolves this file relative to the repository, so it works consistently when launched through pnpm workspaces.

## Checks

```bash
pnpm check
pnpm test
pnpm typecheck
pnpm build
```

The production API serves the built client from `apps/web/dist`.

## API

- `GET /health`
- `GET /api/recipes`
- `GET /api/recipes/search?q=...`
- `GET /api/recipes/:id`
- `POST /api/recipes`
- `PUT /api/recipes/:id`
- `DELETE /api/recipes/:id`

Existing MongoDB recipe documents remain compatible; no data migration is required.
