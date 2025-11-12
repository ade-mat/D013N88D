# Emberfall Ascent Codebase – Language & Tooling Overview

This note walks through the core languages, frameworks, and build tooling that power the D&D web app. Use it as a primer before diving into the more detailed code tours.

## TypeScript Everywhere
- **What it is:** A typed superset of JavaScript that adds optional static typing.
- **Why we use it:** Type safety catches whole classes of bugs (e.g., referencing a property that doesn’t exist). It also improves editor autocomplete, making the large shared game data easier to navigate.
- **How it shows up:**
  - Files end in `.ts` or `.tsx`.
  - Interfaces like `HeroState` in `shared/types.ts` describe the shape of our data structures.
  - The compiler configuration lives in `tsconfig.json` files (one at the repo root for shared settings, plus `client/tsconfig.json` and `server/tsconfig.json` for app-specific tweaks).

## React + Vite on the Client
- **React 18** (`client/src/`):
  - Components (e.g., `client/src/App.tsx`, `client/src/components/CharacterCreator.tsx`) return JSX to describe the UI.
  - Hooks (`useState`, `useEffect`, etc.) manage state and side effects inside functional components.
  - Context providers (`client/src/context/GameContext.tsx` and `client/src/context/AuthContext.tsx`) expose shared state, such as the current hero or the authenticated user.
- **Vite** (`client/vite.config.ts`):
  - Handles fast local development with hot-module replacement.
  - Builds optimized production bundles.
  - Reads `VITE_*` environment variables to inject Firebase credentials at build time.

## Express on the Server
- **Express 4** (`server/src/index.ts`):
  - Creates an HTTP API that serves the campaign data (`GET /api/campaign`), handles NPC oracle requests (`POST /api/oracle`), and exposes save slots (`/api/progress`).
  - Uses middleware for logging (`morgan`), compression, and CORS.
- **Firebase Admin SDK** (`server/src/lib/firebaseAdmin.ts`, `server/src/routes/progress.ts`):
  - Verifies ID tokens coming from the client.
  - Stores and retrieves hero progress from Firestore per authenticated user.

## Shared Modules
- The `shared/` folder contains plain TypeScript files that both the client and server import.
  - `shared/types.ts` defines canonical model shapes—no duplication required.
  - `shared/campaign.ts` bundles the default adventure data used for offline mode.
  - These files compile with both the client and server TypeScript configs (see `server/tsconfig.json` includes).

## Build & Deployment Tooling
- **npm workspaces:** The root `package.json` uses workspaces to manage `client/` and `server/` dependencies separately while sharing a lockfile.
- **Dockerfile:** Builds the full stack into a single container image. The first stage installs dependencies and runs TypeScript builds; the second stage runs the compiled server and serves the static client bundle.
- **GitHub Actions (`.github/workflows/build.yml`):**
  - Authenticates against Google Cloud using workload identity.
  - Builds and pushes the container to Artifact Registry.
  - Deploys to Cloud Run, passing Firebase secrets as environment variables.

## Key Ideas to Remember
- React components are just functions; state lives in hooks or contexts.
- TypeScript interfaces capture the data model for both runtime layers.
- Firebase Authentication (client SDK) issues ID tokens; Firebase Admin (server SDK) verifies them to secure the save API.
- Sharing code across client and server reduces drift—`shared/` is the single source of truth for campaign structures.
