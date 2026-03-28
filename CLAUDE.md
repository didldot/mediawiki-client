# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start in development mode (HMR active)
npm run build        # typecheck + build all three processes
npm run typecheck    # run TS checks for main+preload and renderer separately
npm run lint         # ESLint
npm run format       # Prettier
npm start            # preview the last production build
```

Platform builds (after `npm run build`):
```bash
npm run build:linux
npm run build:win
npm run build:mac
```

## Architecture

This is an **electron-vite** app with the standard three-process split:

| Process | Entry | Compiled to | Context |
|---|---|---|---|
| Main | `src/main/index.ts` | `out/main/index.js` | Node.js — full access |
| Preload | `src/preload/index.ts` | `out/preload/index.js` | Isolated bridge |
| Renderer | `src/renderer/src/main.tsx` | served by Vite dev server | Browser — no Node |

**Security model:** `contextIsolation: true`, `nodeIntegration: false`. The renderer never has Node.js access. All privileged operations (HTTP requests, env vars) happen in the main process and are exposed to the renderer only through named IPC wrappers.

### IPC bridge pattern

New capabilities follow this pattern:

1. **Main** (`src/main/index.ts`): register `ipcMain.handle('channel:name', async () => { ... })`
2. **Preload** (`src/preload/index.ts`): expose a wrapper via `contextBridge.exposeInMainWorld('wikiAPI', { methodName: () => ipcRenderer.invoke('channel:name') })`
3. **Type declaration** (`src/preload/index.d.ts`): add the method signature to `WikiAPI` interface
4. **Renderer**: call `window.wikiAPI.methodName()`

Never expose `ipcRenderer` itself — only named wrapper functions.

### MediaWiki API

- Target: MW 1.33.4 — **Action API only** (`/api.php`). REST API not available.
- Page content is at `response.query.pages[id].revisions[0]['*']` (legacy format, MW < 1.35).
- Authentication: bot password login — two-step: fetch `logintoken` → POST credentials.
- HTTP is done via Node's built-in `fetch` (not Electron's `net.fetch`) to avoid NSS certificate issues on Linux. Session cookies are captured manually and replayed via `wikiFetch()` in `src/main/index.ts`.
- Credentials (`WIKI_URL`, `WIKI_USERNAME`, `WIKI_PASSWORD`) are loaded from `.env` via `dotenv/config` at the top of `src/main/index.ts`. Copy `.env.example` to get started.

### TypeScript config

Two separate `tsconfig` files — `tsconfig.node.json` (main + preload, Node types) and `tsconfig.web.json` (renderer, browser types). Run `npm run typecheck` to check both. The renderer uses `@renderer` as a path alias for `src/renderer/src/`.

### React StrictMode

StrictMode is intentionally **disabled** in `src/renderer/src/main.tsx`. The MediaWiki login IPC call must fire exactly once on mount; StrictMode's double-invocation causes the second call to fail with `WrongToken` since the login token is consumed on first use.
