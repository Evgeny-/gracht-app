# gracht.app

Personal Dutch practice built around notes from lessons with a teacher. Opening the app starts a short session of up to eight exercises, with recent lessons given priority and older material included for review.

The app keeps progress in the browser on each device. It supports light and dark themes, Dutch speech playback where available, and offline use after the app has loaded once.

## Daily practice

Exercises ask you to recall a word, explain the difference between words, build a sentence from shuffled pieces, or change a sentence into another verb tense. You can answer aloud or think through your answer before revealing a model and grading yourself.

- **Again** returns the exercise the next local calendar day. These reviews come before new exercises.
- **Got it** spaces reviews out by 3, 7, 14, 30, then 60 days as you keep succeeding.
- **Too easy** retires the exercise indefinitely. My material → Retired lets you bring it back.

Undo restores the previous schedule for your last answer. My material supports search and groups exercises by lesson date or topic. Each group has a practice button, and individual exercises can be practised from their expanded details.

Choosing a lesson or topic includes its active exercises even when they are not due yet. Sessions run in batches of up to eight. “Keep practising” continues through the selected group without repeating completed exercises; retired exercises stay excluded. “Return to daily” resumes the normal queue.

## Updating lesson material

Curated exercises live in `src/practice/library.ts`; the Google Doc link is stored there as `DOCUMENT_URL`. Updates are prepared from the document when requested. The app does not fetch or modify the document automatically.

When adding a weekly lesson:

1. Add its lesson entry with a stable ID and increasing `sortOrder`. Use the document’s date where present; leave `date` as `null` for undated notes.
2. Add exercises with unique stable IDs and `revision: 1`. Assign `topicIds` from the exported topic list so related exercises can be practised across lessons. Keep exact source quotations and mark practice variations with `source.adapted`. Check corrected model answers independently when the notes contain mistakes or oversimplifications.
3. For sentence builders, provide a word bank and accepted answers using the same words. The UI shuffles the word bank. Verb exercises use full sentences with a subject and context.
4. Keep IDs when editing existing exercises so history survives. Increase `revision` when the answer or task changes enough to need fresh practice. A newer revision becomes due even when the old version was retired. Cosmetic edits can keep their revision.
5. Run `npm run validate:practice` and `npm run test:practice`, then inspect the changed exercises locally. An optional private source extract can be passed to `validate:practice` to check every quotation: `npm run validate:practice -- /path/to/source.json`. The extract should contain a `paragraphs` array of objects with a `text` field.

The source quotations remain in the content data for checking future updates. The interface shows the curated answer, example and explanation without repeating those notes.

## Backups

Settings offers JSON export and import. Version 2 backups include lesson practice, retired items, review history, and preferences. Earlier flashcard data is retained in backups for compatibility, but the original app is no longer part of the interface. Import validates the full file before writing. Restoring a version 1 backup replaces the earlier flashcard data while preserving lesson practice.

Progress does not sync between devices. Export a backup before clearing browser storage or moving to another browser.

## Development

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. Checks:

```bash
npm run lint
npm run validate:practice
npm run validate:decks
npm run test:practice
npm run build
```

The production build includes TypeScript checking. Use `npm run preview` and open `/projects/gracht.app/` to inspect it with its deployed base path.

## Deployment

Merges to `main` deploy through GitHub Actions to https://evgeny.io/projects/gracht.app/.
