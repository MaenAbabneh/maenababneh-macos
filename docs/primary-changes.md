# Primary Changes (Lint + TypeScript cleanup)

This document summarizes the primary changes made during the “make lint pass cleanly” work.

## Why these changes happened

- `npm run lint` needed to run reliably and pass with **0 errors / 0 warnings**.
- ESLint rules in this repo (Next.js + React + TypeScript + Prettier) flagged several patterns:
  - calling `setState(...)` directly inside `useEffect` bodies
  - reading `ref.current` during render
  - a11y: clickable non-interactive elements without keyboard support
  - Next.js: `<img>` usage warnings
  - TypeScript literal-type inference from config constants (e.g. `0.7` inferred as a literal)

## Dependencies added

Dev dependencies:
- `eslint-plugin-prettier`
- `eslint-config-prettier`

These allow Prettier formatting to be enforced via ESLint and avoid conflicting style rules.

## Scripts / tooling changes

- `package.json` lint script uses ESLint directly:
  - `"lint": "eslint"`

Common commands:
- Lint: `npm run lint -- --max-warnings 0`
- Auto-fix: `npm run lint -- --fix`

## Codebase refactors (high level)

### React effects: avoid `setState` directly inside effect bodies
Refactors switched to:
- lazy `useState(() => initialValue)` initialization (often reading `localStorage` safely)
- derived values via `useMemo` instead of storing derived state
- resetting state in user-event handlers (track changes, selections) rather than in effects

### Refs: don’t access `ref.current` during render
- Reworked any “measure via ref in render” patterns into state that updates from event handlers/effects.

### A11y: clickable `div` → `button`
- Converted UI list items and tiles that were `div` + `onClick` into semantic `button` elements.

### Next.js image optimization
- Replaced `<img>` with `next/image` where needed.

### TypeScript: prevent config constants from inferring literal state types
- Typed state hooks explicitly when needed, e.g. `useState<number>(CONFIG.defaultValue)`.

### Naming/shadowing fixes
- Avoided naming props `window` when also using the global browser `window` object.

## Files updated (key ones)

The changes were mostly focused on UI/interaction files:
- Screens and shell: `app/page.tsx`, `components/desktop.tsx`, `components/window.tsx`, `components/menubar.tsx`, `components/control-center.tsx`
- Launch + search: `components/dock.tsx`, `components/launchpad.tsx`, `components/spotlight.tsx`
- Apps: `components/apps/*` (Spotify, Music, Weather, Snake, Notes, Settings, Website, YouTube, Terminal, VSCode)
- UI utilities: `components/ui/*`, `hooks/use-toast.ts`
- Config: `next.config.mjs`

## New files / folders

- Added `docs/primary-changes.md` (this file) to document the work.
- Added [constant](constant) to centralize app configuration/constants (apps registry, UI config, window config, storage keys, mock data).

Main files inside [constant](constant):
- [constant/apps-registry.ts](constant/apps-registry.ts)
- [constant/ui-config.ts](constant/ui-config.ts)
- [constant/window-config.ts](constant/window-config.ts)
- [constant/storage-keys.ts](constant/storage-keys.ts)
- [constant/toast-config.ts](constant/toast-config.ts)
- [constant/music-data.ts](constant/music-data.ts)
- [constant/weather-data.ts](constant/weather-data.ts)
