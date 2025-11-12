# Client Walkthrough – React Game Shell

This guide tours the major client-side modules and explains how they collaborate to present Emberfall Ascent in the browser.

## Application Entry (`client/src/main.tsx`)
- Imports global styles (`client/src/styles/app.css`) and mounts the React tree.
- Wraps `<App />` in `<AuthProvider>` so authentication state is available anywhere.
- React 18’s `createRoot` renders into the `<div id="root">` inside `client/index.html`.

## Authentication Layer
- **`client/src/context/AuthContext.tsx`**
  - Initializes Firebase Authentication using the config supplied by `client/src/lib/firebase.ts`.
  - Exposes `user`, `signIn`, `signUp`, `signOut`, and `getIdToken` via context.
  - Handles the “initializing” state so the UI can show a loading message before the Firebase SDK reports the current session.
- **`client/src/components/AuthPanel.tsx`**
  - Presents a simple email/password form.
  - Switches between sign-in and sign-up modes.
  - Offers “Continue without an account,” which flips the app into guest mode (local saves only).

## Game Shell (`client/src/App.tsx`)
- Orchestrates high-level states:
  - Fetches the campaign JSON from the server (with a fallback to bundled data if offline).
  - Tracks whether the user is authenticated or using guest mode.
  - Renders the `<AuthPanel />` until the user signs in or skips.
- When signed in (or in guest mode), wraps the experience with `<GameProvider>` and renders the game UI from `GameShell`.
  - `GameShell` pulls live data (hero, scene, etc.) from the `useGame` context.
  - Shows account info banner, warning/notice banners, and the dynamic layout (`SceneView`, `Sidebar`, `ConversationPanel`, `DiceTray`, `LogPanel`).

## Game Engine Hook (`client/src/hooks/useGameEngine.ts`)
- Central store for game state: hero sheet, current scene ID, log entries, visited scenes, conversation transcript, last die roll.
- Creates hero state via `createHeroState` when the player finalizes their build.
- Applies scene outcomes, status effects, and inventory changes (see helper `applyEffect`).
- Handles persistence:
  - Uses the “persistence adapter” pattern (`GamePersistence` interface) to abstract storage.
  - Falls back to local storage when no remote adapter is provided.
  - Persists after every state change and hydrates on initial load.
- Exposes a clean API (`startGame`, `chooseOption`, `resetGame`, `recordNpcConversation`, etc.) consumed by the UI components.

## Persistence Providers
- **Local storage** is implemented inside `useGameEngine.ts`.
- **Remote persistence** (`client/src/lib/persistence/remotePersistence.ts`):
  - Wraps `fetch` calls to `GET/POST/DELETE /api/progress`.
  - Injects `Authorization: Bearer <idToken>` headers obtained from `AuthContext`.
  - Handles 404 responses gracefully (treated as no cloud save yet).

## Shared Campaign Data
- `campaignData` (`shared/campaign.ts`) is imported on the client for offline support and as an initial render before remote data arrives.
- Types like `SceneNode`, `HeroState`, and `LogEntry` come from `shared/types.ts`, giving the client compile-time guarantees.

## Styling (`client/src/styles/app.css`)
- Custom CSS (no Tailwind/SCSS) defines the dark fantasy look.
- Includes styles for the auth card, banners, and grid layout.
- Vite automatically processes this file; classes are applied using `className` in JSX.

## Component Highlights
- **`components/CharacterCreator.tsx`** guides new players through race/class/background and ability scores.
- **`components/SceneView.tsx`** renders the current scene narrative and branches.
- **`components/LogPanel.tsx`** lists game events (choices, rolls, narration).
- **`components/DiceTray.tsx`** exposes quick dice mechanics integrated with the engine’s `rollAbilityCheck`.

## Data Flow Summary
1. `AuthProvider` determines authentication state.
2. `App` either shows `<AuthPanel />` or the main game.
3. `GameProvider` instantiates the game engine hook with the correct persistence adapter (remote for authenticated users, local otherwise).
4. UI components subscribe via `useGame()` to render and interact with the hero’s journey.
5. Each interaction updates the engine, which saves the new state locally or in Firestore.
