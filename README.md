# Foodz

Foodz is a TypeScript recipe manager organized as npm workspaces and modeled after TaskBook's stack.

## Stack

- **API:** Hono, Zod, Mongoose/MongoDB, and Pino
- **Web:** Lit, Vite, and Phosphor Icons
- **Shared contracts:** Zod schemas with inferred TypeScript types
- **Tooling:** TypeScript and Vitest

## Workspaces

```text
server/             @foodz/api
client/             @foodz/web
packages/contracts/ @foodz/contracts
```

## Development

Requires Node.js 22+ and Docker (or another MongoDB instance).

```bash
npm install
npm run db:start
npm run dev
```

The web app runs at `http://localhost:5173` and proxies API calls to `http://localhost:3000`. Copy `.env.example` to `.env` in the repository root to customize configuration. The API resolves this file relative to the repository, so it works consistently when launched through npm workspaces.

## Checks

```bash
npm test
npm run typecheck
npm run build
```

The production API serves the built client from `client/dist`.

## API

- `GET /health`
- `GET /api/recipes`
- `GET /api/recipes/search?q=...`
- `GET /api/recipes/:id`
- `POST /api/recipes`
- `PUT /api/recipes/:id`
- `DELETE /api/recipes/:id`

Existing MongoDB recipe documents remain compatible; no data migration is required.
