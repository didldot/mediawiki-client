# mediawiki-client

A cross-platform desktop application for interacting with a MediaWiki instance, built with Electron and TypeScript.

## Tech Stack

- **[electron-vite](https://electron-vite.org/)** — build tooling with fast HMR for main, preload, and renderer processes
- **TypeScript** — throughout all processes
- **contextBridge + preload scripts** — renderer never has direct Node.js access (Electron security best practice)

## MediaWiki API

MediaWiki exposes two APIs:

| API | Endpoint | Notes |
|-----|----------|-------|
| Action API | `/api.php` | Mature, available on all versions |
| REST API | `/rest.php` | Cleaner interface, available since MW 1.35+ |

For authenticated requests, create a **bot password** at `Special:BotPasswords` on your wiki. No special CORS configuration is needed for a desktop Electron app.

Check your MediaWiki version at `Special:Version`.

## VS Code Setup

This repo includes recommended extensions in `.vscode/extensions.json`. Open the project in VS Code and accept the **"Install recommended extensions"** prompt, or install them manually:

| Extension | Purpose |
|-----------|---------|
| ESLint | JavaScript/TypeScript linting |
| Prettier | Code formatting |
| TypeScript Nightly | Latest TS language features |
| Path Intellisense | File path autocomplete |
| npm Intellisense | npm module import autocomplete |
| Error Lens | Inline error/warning display |
| REST Client | Test MediaWiki API calls via `.http` files |
| GitLens | Enhanced git history and blame |
| DotENV | Syntax highlighting for `.env` files |

## Getting Started

> Setup instructions will be added once the project scaffold is in place.
