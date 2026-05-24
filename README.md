# gracht.app

gracht.app is a small Dutch flashcard app for daily practice.

Use it here: https://evgeny.io/projects/gracht.app/

It works in the browser, can be installed on a phone, and keeps progress on the device. Settings include JSON export/import for backups.

## Features

- Practice Dutch to English, English to Dutch, or mixed.
- Choose which decks are active.
- Reveal the answer and grade yourself with `Again`, `Hard`, `Good`, or `Easy`.
- Hear Dutch pronunciation when the browser supports it.
- See progress and simple stats.
- Switch between light, dark, and system themes.
- Install it as an offline web app.

## Development

```bash
npm ci
npm run dev
```

Vite will print the local URL after it starts.

Deck content lives in [src/decks/library.ts](src/decks/library.ts).

## Deployment

Merges to `main` deploy through GitHub Actions to https://evgeny.io/projects/gracht.app/.
