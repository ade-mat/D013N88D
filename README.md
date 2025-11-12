# Emberfall Ascent – Solo D&D Web Adventure

Emberfall Ascent is a single-player narrative RPG inspired by tabletop D&D. Build a lone hero with authentic 5e-style character creation, roll ability checks against dynamic DCs, and guide them through a three-act campaign to reclaim the Heart of Embers before the floating spire collapses on the city below.

## Campaign & Feature Highlights

- **Setting & stakes:** Emberfall is a cliffside city beneath a shattered astral spire. Each act pushes you closer to stabilising (or shattering) the Heart while the city fractures around you.
- **5e-style hero builder:** Choose a race, class, and background, allocate ability scores, pick proficiencies, and automatically derive armor class, speed, equipment, and features from shared reference data.
- **Scene engine:** Story nodes, branching choices, and consequence tracking live in `shared/`. Ability checks (d20 + modifiers) can adjust stress, wounds, influence, and corruption, unlock allies, or change endings.
- **Allied Channel:** The in-app conversation panel lets you message Seraphine, Tamsin, Marek, Nerrix, or Lirael. The server-side oracle (`POST /api/oracle`) crafts responses based on the hero’s flags/status, and the client falls back to scripted dialogue if the endpoint is offline.
- **Manual Dice Tray & Log:** Resolve every skill check yourself inside the Dice Tray, view advantage/disadvantage math, and keep a running campaign log for transparency.
- **Offline-first data:** The client bundles the campaign JSON and uses it automatically if `/api/campaign` can’t be reached. Saves fall back to browser storage whenever Firebase isn’t configured or the player skips sign-in.

## Tech Stack

- **Client:** React 18 + TypeScript via Vite. Context providers (`client/src/context/`) coordinate hero state, authentication, and persistence.
- **State management:** `useGameEngine` centralises character creation, scene progression, dice, log history, and persistence adapters (local storage or remote Firestore).
- **Server:** Express 4 (TypeScript via `ts-node-dev` during development) exposes `/api/health`, `/api/campaign`, `/api/oracle`, and `/api/progress`. NPC replies are generated locally—no external AI calls.
- **Shared modules:** `shared/` contains campaign data, reference tables, and types that both the client and server import directly (see the path aliases in each `tsconfig.json`).
- **Tooling:** npm workspaces, ESLint + TypeScript for the client, and a multi-stage Dockerfile targeting Node 20. GitHub Actions (`.github/workflows/build.yml`) builds the container and deploys to Cloud Run with Firebase secrets injected at build/deploy time.

## Repository Layout

```
├── client/                     # React UI (Vite + SWC)
├── server/                     # Express API, Firebase persistence, NPC oracle
├── shared/                     # Campaign data + shared types
├── lessons/                    # Onboarding notes (overview, client tour, server tour)
├── .github/workflows/build.yml # Cloud Run deployment pipeline
├── .github/workflows/security-scan.yml # CodeQL + MSDO + Trivy security suite
├── Dockerfile                  # Multi-stage build (Node 20, port 8080)
├── dist/                       # Generated server + shared output (after build)
└── README.md
```

### Notable Client Components

- `CharacterCreator` – multi-step builder for race, class, background, ability scores, proficiencies, and allied hooks.
- `SceneView` – renders narrative beats, applies choice effects, and triggers ability checks from `shared/campaign.ts`.
- `ConversationPanel` – Allied Channel UI tied to the `/api/oracle` endpoint with graceful offline fallbacks.
- `DiceTray`, `Sidebar`, `LogPanel` – utilities for quick rolls, sheet-style readouts, status tracking, inventory, allies, and campaign history.
- `Epilogue` – surfaces act outcomes based on flags such as `heart_cleansed`, `nerrix_rescued`, or `marek_support`.

## Quick Start

```bash
# Install dependencies for the workspace (client + server)
npm install

# Terminal 1 – start the Express API on http://localhost:4000
npm run dev

# Terminal 2 – start the Vite dev server with hot reload on http://localhost:5173
npm run dev --prefix client
```

The Vite dev server proxies `/api/*` calls to the Express process. If the API isn’t reachable, the client automatically switches to the bundled campaign data and displays an “Offline mode” banner.

### Manual Dice Workflow

1. Pick a scene option that requires a skill/ability check. The choice is logged immediately but the scene locks until you roll.
2. A banner in `SceneView` explains which check is pending (e.g., *Stealth (Dex) vs DC 14*) and the Dice Tray switches into **Resolve Skill Check** mode.
3. Roll the dice in-app: the Tray automatically applies advantage/disadvantage, shows the modifiers that will be added, and logs the result for the campaign history.
4. Once you hit **Roll Skill Check**, the engine applies the success/failure outcome, updates hero stats, and unlocks the next set of options.
5. Outside of encounters, you can switch the Tray back to freestyle dice (d4–d100) for any ad‑hoc rolls you want to make.

## Core Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Launches the TypeScript Express server with `ts-node-dev` (port 4000 by default). |
| `npm run dev --prefix client` | Starts the Vite dev server (port 5173). |
| `npm run build` | Builds the client (Vite) and server (TypeScript) into `dist/`. |
| `npm run start` | Runs the compiled Express server from `dist/server/src/index.js`; also serves `client/dist`. |
| `npm run lint` | Delegates to the client’s ESLint configuration. |
| `npm run build --prefix client` / `npm run build --prefix server` | Run the build steps individually when needed. |

## Firebase Authentication & Cloud Saves

The client uses Firebase Authentication (Email/Password) and calls `/api/progress` with a bearer token. The server verifies tokens via the Firebase Admin SDK and persists the hero state per user in Firestore. When auth isn’t configured or the player taps “Continue without an account,” the client stays in guest mode and uses `localStorage` (`emberfall-ascent-save-v2`).

1. **Client SDK config:** create `client/.env` (or `.env.local`) with your Firebase web app keys.
   ```bash
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
   ```
2. **Server credentials:** supply the Admin SDK JSON by either
   - setting `FIREBASE_SERVICE_ACCOUNT` to the raw JSON (or a base64-encoded string, which is how CI passes it),
   - pointing `GOOGLE_APPLICATION_CREDENTIALS` at a JSON file, or
   - dropping `server/firebase-service-account.local.json` with the key contents (auto-loaded in development).
   If your JSON is missing `project_id`, also set `FIREBASE_PROJECT_ID`.
3. **Optional overrides:** `FIREBASE_PROGRESS_COLLECTION` (defaults to `gameProgress`) controls the Firestore collection the progress router uses.

## Persistence & API Surface

- `/api/health` – simple health probe (used by Cloud Run & local diagnostics).
- `/api/campaign` – returns the authoritative campaign JSON sourced from `shared/campaign.ts`.
- `/api/oracle` – accepts `{ npcId, prompt, hero }` and produces deterministic NPC replies that incorporate flags, stress, wounds, influence, and corruption.
- `/api/progress` – protected by Firebase ID tokens. Supports `GET` (load), `POST` (save), and `DELETE` (clear).

When Firebase isn’t available, the middleware short-circuits with `503`, and the client remains in guest/local-storage mode. The in-app **Reset Save** button clears both local and remote persistence.

## Building & Deployment

```bash
# Build both apps into dist/
npm run build

# Serve the bundled client + API from dist/ (port 4000 by default)
npm start
```

### Docker

```bash
# Build the multi-stage image (needs the VITE_* build args for client auth config)
docker build -t emberfall-ascent \
  --build-arg VITE_FIREBASE_API_KEY=... \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=... \
  --build-arg VITE_FIREBASE_PROJECT_ID=... \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET=... \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=... \
  --build-arg VITE_FIREBASE_APP_ID=... \
  .

# Run locally on port 8080 (matches Cloud Run/App Engine defaults)
docker run -p 8080:8080 emberfall-ascent
```

### Cloud Run pipeline

`.github/workflows/build.yml` authenticates via Workload Identity, builds the Docker image, pushes it to Artifact Registry, and deploys to Cloud Run (`CLOUD_RUN_SERVICE=dnd`). Secrets provide the `VITE_*` build arguments plus the service-account JSON (base64-encoded) for the runtime environment variables `FIREBASE_SERVICE_ACCOUNT` and `FIREBASE_PROJECT_ID`.

## Testing & Manual Verification

1. Run both dev servers (`npm run dev` and `npm run dev --prefix client`) and open `http://localhost:5173`.
2. Create a hero, progress through all three acts, and confirm that dice rolls adjust stress, wounds, influence, corruption, and narrative branches.
3. Trigger the Allied Channel to ensure `/api/oracle` responds and that the client shows the scripted fallback if you stop the server.
4. Toggle guest mode vs. Firebase-authenticated mode to confirm saves land in local storage or Firestore (`/api/progress` endpoints return `2xx`).
5. Use **Reset Save** to ensure state clears both locally and remotely.

## Additional Notes

- Status values are clamped and validated on the client before persistence, reducing corrupt save data.
- Shared types (`shared/types.ts`) are part of both TypeScript build graphs, so breaking changes surface at compile time.
- The `lessons/` folder contains guided tours of the codebase (overview, client tour, and server tour) if you need a refresher.

## Security Automation

- `.github/workflows/security-scan.yml` runs on every push, PR, and the weekly cron.
  - **CodeQL Suite:** single job that scans the JavaScript/TypeScript codebase and GitHub Actions workflow definitions.
  - **Microsoft Security DevOps:** executes CredScan (needs.NET 6) and Checkov with SARIF uploads to the GitHub Security tab.
  - **Trivy Scan:** builds the Docker image from this repo and publishes container vulnerability findings back to GitHub.
- `.github/workflows/build.yml` remains focused on Cloud Run deployment but now declares only the minimum permissions required to satisfy Checkov gatekeepers.
