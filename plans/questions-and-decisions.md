# gracht.app Questions And Decisions

Last updated: 2026-05-24

## Current Assumptions

- The first app is a static PWA, not a native Android app.
- Storage is local browser storage via IndexedDB.
- Decks are bundled from repo files at build time.
- Initial content is Dutch-English for A0-A1.
- The first training mode is flashcard recall.
- Review grading uses Anki-style four-button ratings.
- Decks can support both Dutch -> English and English -> Dutch, and the user can choose direction.
- Word decks and sentence decks can be separate.
- Typed-answer training is not in v1.
- V1 should experiment with browser text-to-speech for Dutch pronunciation.
- V1 should include progress export/import.

## Open Questions

1. **Daily target:** do you want a daily goal such as `20 reviews/day`, `10 new cards/day`, or no fixed goal?

2. **Scheduler strictness:** should the app behave like spaced repetition with due dates, or allow free drilling of any deck whenever you want?

3. **Deck source policy:** should we only ship original decks we write, or include external public/licensed sources after review?

4. **UI density:** do you prefer a calm Duolingo-like mobile UI, or a more efficient Anki-like utility UI?

5. **Language labels:** should the app UI be in English, Dutch, or optionally switchable?

6. **New-card defaults:** how many new cards should be introduced per day by default?

7. **Deck granularity:** should the first bundled decks be small and topical, or larger decks with internal tags/filters?

8. **Statistics detail:** which matters more for v1: simple motivation stats, or accurate spaced-repetition diagnostics?

9. **Project setup timing:** should I scaffold the app after these remaining decisions, or should we expand the PRD/design plan first?

## Decisions

- **Answer grading:** v1 uses Anki-style `Again / Hard / Good / Easy`.
- **Card direction:** v1 should support Dutch -> English and English -> Dutch, with user-selectable direction where decks support it.
- **Deck structure:** word decks and sentence decks can be separate.
- **Typing mode:** not in v1.
- **Pronunciation:** experiment with browser text-to-speech in v1.
- **Progress safety:** include export/import in v1.
