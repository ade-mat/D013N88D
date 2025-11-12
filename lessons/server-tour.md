# Server Walkthrough – Express API & Firebase Integration

This document explains the backend architecture, focusing on request handling, Oracle responses, and the Firestore-powered progress API.

## Entry Point (`server/src/index.ts`)
- Creates an Express application with common middleware:
  - `cors()` to allow the Vite dev server and the deployed client to call into `/api`.
  - `express.json({ limit: '1mb' })` to parse JSON bodies (hero payloads, progress saves).
  - `compression()` for gzip responses.
  - `morgan('dev')` for structured request logging.
- Exposes REST endpoints:
  - `GET /api/health` – quick readiness check.
  - `GET /api/campaign` – returns the canonical campaign object imported from `shared/campaign.ts`.
  - `POST /api/oracle` – accepts `{ npcId, prompt, hero }`, runs through `createOracleResponse`, and returns a narration string.
  - Mounts `progressRouter` at `/api/progress` for authenticated persistence (see below).
- Serves the compiled React app when `client/dist` is present (supporting single-container deployments).

## Firebase Admin Bootstrap (`server/src/lib/firebaseAdmin.ts`)
- Uses lazy initialization so the GCP credentials are only parsed on demand.
- Credential sources, in order:
  1. `FIREBASE_SERVICE_ACCOUNT` environment variable (raw JSON or base64 string; the helper handles both).
  2. Local development file `server/firebase-service-account.local.json` (git-ignored—drop your real service account here).
  3. Default Google Cloud credentials (`applicationDefault()`, e.g., Cloud Run service account).
- Initializes:
  - `admin.initializeApp` with the resolved project ID.
  - `firestore()` and `auth()` instances, memoized for reuse.
- Exports helper functions:
  - `getFirestore()`, `getFirebaseAuth()` – safe accessors used in routers/middleware.
  - `isFirebaseAdminReady()` – quick health flag for endpoints to return 503 if credentials aren’t configured.
  - `serverTimestamp()` – convenience for Firestore `FieldValue.serverTimestamp()`.

## Authentication Middleware (`server/src/middleware/firebaseAuth.ts`)
- Extracts Bearer tokens from the `Authorization` header.
- Verifies Firebase ID tokens with the Admin SDK (`auth.verifyIdToken`).
- Attaches the decoded token to `req.firebaseUser`, granting downstream handlers access to `uid`, `email`, and other claims.
- Returns 401 if tokens are missing or invalid; returns 503 if Firebase isn’t initialized.

## Progress Routes (`server/src/routes/progress.ts`)
- Mounted at `/api/progress` and protected by `requireFirebaseAuth`.
- Uses Firestore collection `gameProgress` by default (overridable via `FIREBASE_PROGRESS_COLLECTION`).
- Endpoints:
  - `GET /api/progress` – fetches the user’s saved `GameStateSnapshot`. Returns 404 if no document exists yet.
  - `POST /api/progress` – validates the incoming payload matches the `GameStateSnapshot` shape, then writes it with `serverTimestamp()` metadata.
  - `DELETE /api/progress` – removes the save document for the current user.
- Payload validation ensures we don’t accidentally write malformed data to Firestore.

## Shared Types (`shared/types.ts`)
- `GameStateSnapshot` mirrors the structure persisted by the client and server.
- Shared hero, scene, and log types keep both layers consistent when reading and writing Firestore documents.

## Deployment Notes
- The Dockerfile’s runtime stage copies the compiled TypeScript output (`dist/server/src/index.js`) and the static client bundle.
- The GitHub Actions workflow:
  - Injects Firebase web SDK credentials during the Docker build (`VITE_FIREBASE_*` build args).
  - Base64-encodes the service account JSON before calling `gcloud run deploy`, guarding against special-character issues.
  - Sets `FIREBASE_SERVICE_ACCOUNT` and `FIREBASE_PROJECT_ID` env vars on the Cloud Run service so the Admin SDK can initialize.

## Local Development Tips
- Use `npm run dev --prefix server` to run the API with live TypeScript reloading (`ts-node-dev`).
- If you need remote persistence locally:
  - Create `server/firebase-service-account.local.json` with your service account JSON.
  - Start a Firebase Emulator or connect to the real Firestore project.
  - Run the client (`npm run dev --prefix client`) so it calls the same `/api/progress` endpoints with valid ID tokens.
