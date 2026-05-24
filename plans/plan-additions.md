# gracht.app Plan Additions

Last updated: 2026-05-24

This file adds proposed product and technical refinements to the original plan before implementation. It uses P0-P3 labels to show sequencing and scope. P4-level ideas such as accounts, cloud sync, backend services, full Anki compatibility, app-store distribution, and AI-generated in-app content remain out of scope for the foreseeable version plan.

## P0: Architecture-Setting Decisions

These decisions should be resolved before implementation because they shape the deck model, persistence model, scheduler, and review flow.

- Separate `note` from generated `card`.
  - A note is the source learning item, such as `waar = where`.
  - Cards are generated review prompts, such as Dutch -> English and English -> Dutch.
- Store scheduler state per generated card, not per note.
  - Example: `nl-a1-question-words:waar:nl-en` and `nl-a1-question-words:waar:en-nl` should have independent due dates and review history.
- Treat reverse-direction cards as independent progress.
  - English -> Dutch is usually harder than Dutch -> English, so it should not share the same scheduler state.
- Define the deck schema before building UI.
  - Required fields should include stable ids, Dutch text, English text, supported directions, tags, deck/source metadata, and content version.
  - Optional fields should support examples, notes, accepted variants, article metadata for nouns, and pronunciation/audio metadata later.
- Define deck validation rules before creating a large deck library.
  - Catch duplicate ids, missing translations, unsupported directions, ambiguous card shapes, invalid tags, and invalid source/version metadata.
- Define review modes clearly.
  - Due review affects the spaced-repetition schedule.
  - Free practice should either not affect SRS or should record separate practice metrics.
- Define bundled deck update behavior.
  - User progress must survive content edits when stable ids remain the same.
  - Deletions, renames, splits, and meaning changes need explicit migration or deprecation rules.
- Add IndexedDB schema versioning from day one.
  - Database migrations should be part of the technical design, not a later patch.
- Define backup import/export format from day one.
  - Export should include a schema version, app version, exported timestamp, settings, card state, and review history.

## P1: V1 Core Experience

These belong in the first useful version because they make the app usable as a daily personal study tool.

- First-launch onboarding with a recommended starter setup.
  - Avoid enabling the entire bundled library by default.
  - Start with a small A0-A1 set that can be finished in short sessions.
- Daily practice defaults.
  - Proposed starting point: `10` new cards/day and `30` review cards/day, both adjustable.
- Concrete scheduling behavior for `Again / Hard / Good / Easy`.
  - Each button should have a predictable interval effect, even if the first scheduler is simple.
- Study directions.
  - Dutch -> English.
  - English -> Dutch.
  - Mixed mode across active cards that support the selected direction.
- Enable/disable decks in the UI.
- Study one deck, selected decks, or all active decks.
- Mobile-first study screen.
  - Large prompt, clear reveal action, thumb-friendly grading buttons.
  - Keep navigation secondary during active review.
- Undo last grade.
  - This is important because accidental taps are common on mobile.
- Manual JSON export/import for progress backup and device migration.
- Basic stats.
  - Due today.
  - Reviewed today.
  - Streak.
  - Active decks/cards.
  - New cards introduced today.
- Browser text-to-speech for Dutch prompts and examples where available.
  - The UI should degrade cleanly if no Dutch voice exists.
- Light/dark themes using CSS variables and `prefers-color-scheme`, with manual override.
- PWA installability and offline support for Android home-screen use.

## P2: Early Quality Improvements

These should follow soon after the core loop works. They improve trust, content quality, and control without expanding the product too much.

- Suspend card.
  - Useful for confusing, bad, duplicate, or currently irrelevant cards.
- Bury card for today.
  - Useful when a prompt is temporarily annoying without permanently hiding it.
- Deck detail screen with per-deck progress.
  - Cards total, active/suspended, new/learning/reviewed, due count.
- Simple due forecast.
  - A small next-few-days view is enough before adding larger analytics.
- Backup reminder.
  - Warn if progress has not been exported recently.
- Accepted answer variants in card data.
  - Especially important before typed-answer mode, but useful already for content quality.
- Tags and filtered study.
  - Example tags: `question-word`, `pronoun`, `de-word`, `het-word`, `verb`, `word-order`, `sentence`.
- Deck validation command in local checks.
  - Keep bundled content from silently drifting into invalid or low-quality shapes.
- Prompt examples on reveal.
  - Examples should usually support the answer after recall, not overload the prompt.
- New-card source preference.
  - Decide whether new cards are pulled globally from all active decks or from a selected/current deck first.
- Persistent-storage request where supported.
  - Browser storage can still be cleared; this reduces but does not eliminate that risk.

## P3: Expansion After The Habit Loop Works

These are good additions once daily flashcard practice is reliable and the first decks feel useful.

- Richer statistics.
  - Retention over 7/30 days.
  - Reviews per day chart.
  - Learned cards.
  - Per-deck remembered rate.
- Free drill or cram mode.
  - Keep it distinct from SRS unless the user explicitly chooses to grade into schedule.
- Cloze deletion cards.
  - Useful for phrases, word order, and sentence patterns.
- Type-answer mode.
  - Most useful for English -> Dutch once accepted variants are reliable.
- Sentence builder / word-order drills.
  - Good for Dutch verb-second and subclause patterns.
- Minimal-pair and pronunciation drills.
  - Examples: `ui`, `ij/ei`, `g/ch`, `oe`, `ie`.
- Recorded audio support in deck files.
  - Browser TTS can remain the fallback.
- Weakness practice by low-retention tags.
  - Build short sessions from cards or tags that are repeatedly missed.
- Context cards.
  - Show a word inside two or three short examples before testing.
- Larger licensed deck imports.
  - Only add external sources after license review and clear attribution/source metadata.

## Recommended First Implementation Boundary

The first implementation pass should cover P0 decisions and a narrow P1 slice:

- Deck/note/card data model.
- Deck validation.
- IndexedDB schema.
- Basic scheduler.
- Active deck settings.
- One clean study flow.
- Export/import.
- Minimal PWA/offline setup.

Everything else should be layered after the core loop is working on real starter decks.
