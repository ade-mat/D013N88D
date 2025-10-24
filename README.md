# Emberfall Ascent – Solo D&D Web Adventure

Emberfall Ascent is a single-player narrative RPG inspired by tabletop D&D. Build a lone hero with authentic 5e-style character creation, roll dynamic skill checks, and guide them through a three-act campaign to reclaim the Heart of Embers before the floating spire collapses on the city below.

## Campaign Highlights

- **Setting:** Emberfall, a cliffside city beneath a shattered astral spire.
- **Runtime:** Designed for a focused 1–2 hour session with branching scenes and multiple endings.
- **Acts & Stakes:** Rally allies in the fracturing city, ascend the unstable spire, and confront (or redeem) the corrupted guardian Lirael.
- **Allies & Conversations:** Meet Seraphine, Tamsin, Marek, Nerrix, and more. You can chat with allies through the in-app “Allied Channel” powered by a lightweight oracle service.
- **Systems:** Attribute-driven skill checks (d20 + stat vs DC), inventory boons, consequence tracking (stress, wounds, influence, corruption), optional AI-style NPC banter.

## Tech Stack

- **Frontend:** React + TypeScript (Vite), scoped CSS, dedicated dice tray utilities.
- **State:** Custom hook + context for hero progression, log history, and branching outcomes.
- **Backend:** Express (TypeScript) exposing campaign JSON, NPC oracle endpoint, and static asset hosting.
- **Shared data:** Campaign structure & types live under `shared/` for both client and server.
- **Container:** Docker multi-stage build ready for App Engine, Cloud Run, or container platforms.

## Quick Start

```bash
# Install dependencies (uses npm workspaces)
npm install

# Start the API + serve client build concurrently
npm run dev

# In another terminal, run the React dev server (optional if you prefer hot-reload)
npm run dev --prefix client
```

By default the Express server runs on `http://localhost:4000` and proxies `/api/*` for the React dev server (`http://localhost:5173`).

## Account Sync & Cloud Saves

The web app now supports Firebase Authentication with Firestore-backed saves so multiple players can log in and resume their heroes from any device.

1. Create a Firebase project and enable **Email/Password** sign-in under Authentication.
2. Add a web app and copy the SDK config into `client/.env` (keep this file as a template—copy it to `client/.env.local` for your actual secrets):
   ```bash
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
3. Generate a service account key (JSON) with **Firebase Admin SDK** access.  
   - In the [Firebase console](https://console.firebase.google.com/), open **Project settings → Service accounts → Firebase Admin SDK → Generate new private key**. Download the JSON file; keep it private.  
   - Option A: set the environment variable `FIREBASE_SERVICE_ACCOUNT` to the JSON contents. For shells that dislike quotes, base64-encode the file (`base64 service-account.json`) and use that string instead. If the JSON lacks a `project_id`, also set `FIREBASE_PROJECT_ID`.  
   - Option B: store the JSON on disk and set `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/service-account.json`. The server reads the file when it starts.
   - For local development, create `server/firebase-service-account.local.json` (ignored by git) and paste your real key there. The server loads the `.local` file automatically if the environment variable is unset.
4. Optionally override the Firestore collection name with `FIREBASE_PROGRESS_COLLECTION` (defaults to `gameProgress`).

When Firebase is unavailable or you choose "Continue without an account", Emberfall Ascent automatically runs in guest mode and keeps saves in local storage on the current device.

## Project Structure

```
├── client/            # React UI (Vite, TypeScript)
├── server/            # Express + NPC oracle (TypeScript)
├── shared/            # Campaign data and shared types
├── dist/              # Server build output (generated)
├── Dockerfile         # Container build (multi-stage)
└── README.md
```

### Notable Client Components

- `CharacterCreator` – multi-step D&D character builder (race, class, background, ability scores, skill proficiencies).
- `SceneView` – renders narrative text, dice results, and branching choices.
- `ConversationPanel` – talk to allies (Seraphine, Tamsin, Marek, Nerrix, Lirael) with fallback oracle responses.
- `DiceTray` – quick access to arbitrary dice formulas (d4 through custom expressions).
- `Sidebar` & `LogPanel` – track stats, inventory, allies, and story log.
- `Epilogue` – summarises endings based on heart outcome + flags.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Express API (port 4000). |
| `npm run dev --prefix client` | Vite dev server for the UI (port 5173). |
| `npm run build --prefix client` | Builds the React app to `client/dist`. |
| `npm run build --prefix server` | Compiles the Express server + shared data to `dist/`. |
| `npm run start` | Runs the compiled server from `dist/`. |
| `npm run lint --prefix client` | Lints the React code with ESLint. |

## Building & Deployment

```bash
# Produce production assets (client + server)
npm run build

# Run the compiled server
npm start  # serves API + static client by default on port 4000
```

### Docker

```bash
# Build the container
docker build -t emberfall-ascent .

# Run it locally (mapped to port 8080)
docker run -p 8080:8080 emberfall-ascent
```

The container listens on port `8080` to align with App Engine / Cloud Run defaults. Set `PORT` as needed.

## Testing & Verification

1. Install dependencies and run both dev servers (`npm run dev`, `npm run dev --prefix client`).
2. Open `http://localhost:5173` for hot-reload development or `http://localhost:4000` to serve the built client.
3. Walk through the campaign, verifying:
   - Dice rolls adjust outcomes, stress, wounds, and influence.
   - Flags (e.g., `heart_cleansed`, `nerrix_rescued`) influence later scenes and epilogue text.
   - Conversation panel returns appropriate responses and falls back gracefully if the oracle endpoint is unreachable.
4. Optionally clear the save from the setup screen to test a fresh run.
5. (Optional) After configuring Firebase, sign in with multiple accounts to confirm that progress is saved to Firestore and reloads correctly on different browsers/devices.

## Notes

- When authentication is configured, saves are stored per-user in Firestore. In guest mode the app falls back to local storage (`emberfall-ascent-save-v2`) on the current device.
- Use **Reset Save** on the setup screen to clear the current hero and remove the saved progress (local or cloud).
- The NPC oracle is deterministic and runs entirely locally—no external AI service required.
- When deploying to GCP (App Engine or Cloud Run), build the container and push to a registry; the server will serve both the API and static client content.
