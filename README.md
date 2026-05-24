# gracht.app

Mobile-first Dutch A0-A1 flashcard trainer, built as a local-first static PWA.

The app trains bundled Dutch-English decks generated from the starter cheat sheet. It stores deck preferences, review history, scheduler state, and settings locally in IndexedDB, with JSON export/import for backup.

## Features

- Dutch -> English, English -> Dutch, and mixed-direction review.
- Separate generated review cards per direction, so recognition and recall progress are independent.
- Anki-style grading: `Again`, `Hard`, `Good`, `Easy`.
- Local bundled deck library with enable/disable controls.
- Browser Dutch text-to-speech where available.
- Light/dark/system themes.
- Local stats and per-deck progress.
- Installable/offline PWA.

## Development

```bash
npm ci
npm run dev
```

Because the production app is deployed under `/projects/gracht.app/`, the Vite dev URL is:

```text
http://localhost:5173/projects/gracht.app/
```

Useful checks:

```bash
npm run validate:decks
npm run typecheck
npm run lint
npm run build
```

## Decks

Deck content lives in [src/decks/library.ts](src/decks/library.ts). Stable note ids are required because local progress is keyed from generated card ids:

```text
<deck-id>:<note-id>:nl-en
<deck-id>:<note-id>:en-nl
```

Run `npm run validate:decks` after deck edits.

## Deployment

Merges to `main` deploy through GitHub Actions to:

```text
https://evgeny.io/projects/gracht.app/
```

The workflow builds the app and copies `dist/` into `projects/gracht.app/` in `evgenyio/evgenyio.github.io`.
