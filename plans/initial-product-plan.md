# gracht.app Initial Product Plan

Last updated: 2026-05-24

## Product Shape

**gracht.app** is a static, installable, mobile-first Dutch learning app focused on A0-A1 study. The first version is close to Anki: show a prompt, let the learner reveal or recall the translation, then mark whether they remembered it. The app should work offline, store progress locally on the device, and support a growing library of repo-managed decks.

The app is not a social learning platform and does not need accounts, sync, or a backend in v1.

## Goals

- Practice Dutch-English words and short sentences from local decks.
- Support both Dutch -> English and English -> Dutch practice where a deck allows it.
- Enable/disable decks from a larger deck library.
- Study one deck, selected decks, or a mixed "all active decks" queue.
- Store all study state locally in the browser.
- Export/import local progress for backup and device migration.
- Show useful statistics globally and per deck.
- Install on Android home screen as a PWA.
- Keep the UI fresh, clean, touch-friendly, and usable in light/dark themes.
- Make adding decks a repo operation: add deck files, update/generated manifest, rebuild.

## Non-Goals For V1

- User accounts.
- Cloud sync.
- Multiplayer/social features.
- Full Anki `.apkg` compatibility.
- Heavy grammar course content.
- AI-generated content inside the app.
- Typed-answer training.
- App-store distribution.

## Proposed Stack

- App framework: **React + TypeScript + Vite**.
- PWA: **vite-plugin-pwa** for service worker, manifest, and installability.
- Local database: **IndexedDB via Dexie**.
- Scheduling: **FSRS via `ts-fsrs`** if it stays lightweight enough; otherwise a simple SM-2-like scheduler for v1 with a migration path to FSRS.
- Routing: **TanStack Router** if we want type-safe routes; otherwise a tiny internal tab/router state is enough for v1.
- UI primitives: **Radix UI** where accessibility-heavy primitives are needed.
- Styling: **Tailwind CSS v4** plus local reusable components.
- Component source: consider **shadcn/ui** for copied, owned components rather than a black-box component library.
- Icons: **lucide-react**.
- Charts: **Recharts** initially, unless bundle size becomes a problem.
- Tests: **Vitest + React Testing Library** for logic/components; **Playwright** for PWA/mobile smoke checks.

References checked before this plan:

- React new project guidance: https://react.dev/learn/start-a-new-react-project
- Vite React/TypeScript template support: https://vite.dev/guide/
- Vite PWA plugin: https://github.com/vite-pwa/vite-plugin-pwa
- Dexie IndexedDB docs: https://dexie.org/docs
- `ts-fsrs`: https://github.com/open-spaced-repetition/ts-fsrs
- Tailwind with Vite: https://tailwindcss.com/docs/installation/using-vite
- shadcn/ui with Vite: https://ui.shadcn.com/docs/installation/vite
- Radix primitives: https://www.radix-ui.com/primitives/docs
- Lucide icons: https://lucide.dev/
- Recharts: https://recharts.github.io/en-US/

## Local Storage Model

"Stored in localhost" should mean browser-local persistence, not a localhost server. For a static installable PWA, the durable storage should be IndexedDB.

Candidate IndexedDB tables:

- `cards`: imported card snapshots keyed by stable card id and deck version.
- `decks`: deck metadata, enabled state, local install state, source version.
- `reviews`: append-only study events.
- `cardState`: current scheduler state per card.
- `dailyStats`: denormalized aggregates for fast charts.
- `settings`: theme, study direction, daily target, active study mode.
- `backups`: optional metadata about local export/import events.

Important constraint: if a deck file changes in the repo, user progress should not vanish. Card ids must be stable and content changes must be handled as versioned updates.

V1 should include export/import of the local study database as a JSON file. This protects progress from Android/browser storage loss and makes it possible to move progress between devices manually.

## Deck File Format

Decks should live as files in the app repository, for example:

```text
src/decks/
  manifest.json
  nl-a0-core.json
  nl-a1-cheat-sheet-verbs.json
  nl-a1-question-words.json
```

Candidate card fields:

```json
{
  "id": "nl-a1-question-words:waar",
  "front": "waar",
  "back": "where",
  "type": "word",
  "tags": ["a1", "question-word"],
  "examples": [
    {
      "nl": "Waar woon je?",
      "en": "Where do you live?"
    }
  ],
  "notes": "Question word.",
  "directions": ["nl-en", "en-nl"]
}
```

Deck metadata:

```json
{
  "id": "nl-a1-question-words",
  "title": "Dutch A1 Question Words",
  "level": "A0-A1",
  "description": "Core Dutch question words with examples.",
  "source": "original",
  "license": "project-owned",
  "cards": []
}
```

## Initial Deck Library

Start with repo-owned decks derived from the cheat sheet:

- A0 Survival Phrases.
- A0 Numbers + Time.
- A1 Question Words.
- A1 Pronouns.
- A1 Articles + Demonstratives.
- A1 Word Order Patterns.
- A1 Common Regular Verbs.
- A1 Irregular Verbs.
- A1 Core Nouns.
- A1 Adjectives + Chunks.
- A1 Adverbs + Connectors.
- A1 Mini Sentences.

External sources can expand the library, but only with clear licensing. Candidate sources to evaluate:

- Tatoeba Dutch-English sentence pairs: https://tatoeba.org/nl/downloads
- Wiktionary Dutch frequency lists: https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Dutch
- Dutch Language Institute frequency materials: https://taalmaterialen.ivdnt.org/download/tstc-frequentielijsten-corpora/

Commercial or unclear-license Anki decks should not be bundled automatically. We can support manual import later if the user owns the content.

## V1 Study Flow

1. User opens app.
2. Home shows due count, daily streak, active decks, and primary "Study" action.
3. User picks direction: Dutch -> English, English -> Dutch, or mixed, subject to the active decks' supported directions.
4. Study queue chooses due cards from active deck set.
5. Card front appears.
6. User can tap a speaker button to hear browser text-to-speech pronunciation when the prompt contains Dutch.
7. User taps to reveal back.
8. User marks result with Anki-style choices:
   - Again
   - Hard
   - Good
   - Easy
9. Scheduler updates local card state.
10. Session summary shows cards reviewed, remembered rate, new cards, due tomorrow.

The first version does not require typed answers. Typing can be added as a separate mode after the recall loop, scheduler, and stats are solid.

## Pronunciation

V1 should experiment with browser text-to-speech through the Web Speech API:

- Prefer a Dutch voice when available, such as `nl-NL`.
- Provide a speaker button on Dutch prompts and Dutch example sentences.
- Cache the chosen voice preference in settings.
- Keep the UI resilient when no Dutch voice is installed.

This is intentionally a lightweight pronunciation aid, not a full audio deck system. Recorded native audio can be a later deck capability.

## Statistics

Global stats:

- Reviews per day.
- Cards learned.
- Retention/remembered rate.
- Due today/tomorrow.
- Streak.
- New cards per day.
- Review time estimate if we track session duration.

Per-deck stats:

- Active/inactive.
- Cards total.
- New/learning/reviewed/suspended.
- Due count.
- Retention over last 7/30 days.
- Reviews per day.

Graphs:

- Daily reviews bar chart.
- Retention line chart.
- Due forecast stacked bars.
- Deck progress donut or segmented bar.

## Mobile-First UI

Core screens:

- Home dashboard.
- Study card.
- Deck library.
- Deck detail/stats.
- Global stats.
- Settings.

Navigation:

- Bottom nav for Home, Study, Decks, Stats, Settings.
- Large touch targets.
- No nested card-inside-card layouts.
- No double borders.
- Fresh but restrained visual language: clear surfaces, strong typography, useful color, low decoration.
- Theme support through CSS variables and `prefers-color-scheme`, with manual override.

## Learning Modes Beyond Anki

Good v2 candidates:

- Type answer: require typing Dutch, then self-grade.
- Multiple choice for early-stage recognition.
- Cloze deletion: missing word inside a Dutch sentence.
- Sentence builder: reorder words into correct Dutch word order.
- Listening mode: play audio, pick/type what was said.
- Speaking mode: say the answer, compare with expected text later; automated speech scoring can be later.
- Minimal pairs/pronunciation drills: `ui`, `ij/ei`, `g/ch`, `oe`, `ie`.
- Grammar pattern drills: transform statement -> question, or present -> past.
- Daily micro-lesson: 5 new cards + 10 due reviews.
- Weakness practice: auto-build a session from low-retention tags.
- Context cards: show a word inside 2-3 short examples before testing.

## Implementation Phases

### Phase 0: Decisions

- Confirm initial deck source policy.
- Confirm daily target/new-card defaults.
- Confirm study queue behavior: strictly due cards, free drill, or both.
- Confirm UI density direction.
- Confirm whether the first app should be fully scaffolded now or after plan sign-off.

### Phase 1: Scaffold

- Create Vite React TypeScript project in `/Users/evgeny.nikiforov/Projects/gracht-app`.
- Add PWA, Tailwind, icon, test, formatting, and lint setup.
- Add app shell, theme system, route/navigation structure.
- Add first static deck files from the cheat sheet.

### Phase 2: Core Study

- Deck manifest loader.
- Enable/disable decks.
- Direction selector: Dutch -> English, English -> Dutch, mixed.
- Study queue over active decks.
- Card reveal and grading.
- Browser text-to-speech pronunciation button for Dutch prompts.
- Local IndexedDB persistence.
- Progress export/import JSON.
- Basic session summary.

### Phase 3: Scheduling + Stats

- FSRS or simple scheduler integration.
- Per-card state.
- Review history.
- Global and per-deck charts.
- Due forecast.

### Phase 4: PWA Polish

- Android install manifest and icons.
- Offline cache.
- App update handling.
- Mobile viewport QA.
- Light/dark visual QA.

### Phase 5: Deck Expansion

- Add more A0-A1 decks.
- Add import/build scripts for licensed external sources.
- Add deck validation tests.

## Risks

- Deck licensing can get messy. We should prefer original decks and clearly licensed sources.
- PWA local storage can be cleared by the browser under some conditions; export/backup matters eventually.
- A full Anki clone is too broad. The first version should be narrow: fast daily practice for beginner Dutch.
- Too many learning modes in v1 will delay the useful version. Keep alternate modes behind a v2 roadmap.
