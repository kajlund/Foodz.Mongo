# Foodz API

TypeScript REST API built with Hono, Zod, Mongoose/MongoDB, and Pino.

Run commands from the repository root:

```bash
npm install
npm run db:start
npm run dev
```

Configuration is read from `.env` at the repository root; see the root `.env.example`. The API listens on port 3000 by default and exposes `/health` plus CRUD and search routes below `/api/recipes`.

```bash
npm test -w @foodz/api
npm run typecheck -w @foodz/api
npm run build -w @foodz/api
```
