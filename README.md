# Foodz Workspace

Monorepo workspace for the **Foodz** application, featuring a REST API backend and upcoming web client.

## Repository Structure

```
foodz/
├── server/      # Node.js, Express, Mongoose REST API
└── client/      # (Upcoming) Web Client application
```
For now the client is just a PoC using Lit Web Components withou any build step. If it grows into something more substantial, I will add a build step.

## Getting Started

### Backend API Server

Navigate to the `server` directory for instructions on configuring environment variables, running MongoDB via Docker, starting the API server, and API endpoint documentation:

```bash
cd server
npm install
npm run dev
```
See [`server/README.md`](./server/README.md) for full documentation.

## Ideas for Improvements

- Add filtering functionality by tags or originator (by field)
- Add better search functionality. Searching should be case insensitive and should search for the name, description, ingredients. 
- Ingredient unit conversions or dynamic serving size scalers
- Image upload support
- Dark / Light theme toggles or custom styling updates

