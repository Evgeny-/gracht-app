# Study Experience Improvement Plan

Last updated: 2026-05-25

## Purpose

This plan describes how to make gracht.app's flashcard experience feel like a genuinely useful daily language-learning tool instead of a deck-by-deck card browser. It covers both the learning engine improvements, such as Smart Mix and spaced repetition, and the mobile-first study interaction improvements, such as fixed bottom controls and swipe-based grading.

The current app already has a promising foundation: bundled decks, generated Dutch -> English and English -> Dutch cards, per-card progress, IndexedDB persistence, Anki-style grading buttons, text-to-speech, basic stats, undo, and a first version of mixed direction study. The core problem is that the current "Mix" experience is not yet a real smart mix. It still feels too much like walking through ordered deck material, and the scheduler is a simple interval system rather than a mature memory model.

The goal is to preserve the simplicity of the current app while making the study loop dramatically more pleasant, varied, trustworthy, and effective.

## Product Motivation

The user expectation for "Mix" is:

> If I enabled several decks, Mix should pull useful cards from all of them in a varied order, while still respecting spaced repetition.

That expectation has two parts:

1. **True mixing across active content.**
   - The user should not feel that they are finishing one deck, then moving to the next deck.
   - The queue should feel global, varied, and alive.
   - Enabled decks should contribute to one shared study pool.

2. **Real spaced-repetition behavior.**
   - Cards the user knows should appear less often.
   - Cards the user fails should return sooner.
   - Hard cards should remain visible enough to improve, but not become annoying.
   - Easy cards should disappear for longer intervals.
   - The user should be able to trust that finishing today's reviews means they are done for now.

This is especially important for language learning. Vocabulary practice is not just about seeing items in random order. The app should protect against false recall, avoid immediate reverse-card spoilers, pace production cards carefully, and keep sessions short enough to become a habit.

## Current Behavior Summary

The current implementation is mostly in:

- `src/lib/studyQueue.ts`
- `src/lib/scheduler.ts`
- `src/lib/db.ts`
- `src/screens/StudyScreen.tsx`
- `src/hooks/useAppData.ts`

Current characteristics:

- Card state is stored per generated card.
- Dutch -> English and English -> Dutch are independent generated cards.
- `Again / Hard / Good / Easy` update `dueAt`, `intervalDays`, `ease`, `reps`, and `lapses`.
- New cards are due immediately until reviewed.
- Due review cards are shown before new cards.
- In mixed direction mode, once one direction of a note is reviewed, the other direction is buried for the current session.
- The queue interleaves by deck, but each deck bucket is sorted deterministically.

Problems:

- Mix is still too deterministic.
- Deck order remains visible in the experience.
- New cards are not introduced with a clearly designed global policy.
- Scheduling and queue composition are entangled.
- There is no clear distinction between serious due review and casual practice.
- Sibling burying is session-local and not persisted until tomorrow.
- The scheduler is useful but simple; it is not FSRS-like.
- The UI does not explain why a card is being shown or what each grade will do.

## Research Notes

Useful external reference points:

- Anki is built around active recall and spaced repetition: the user actively tries to remember, and easier cards receive longer intervals.
- Anki has separate concepts for new cards, learning cards, review cards, relearning/lapsed cards, burying, suspending, and deck/display ordering.
- Anki supports sibling burying so related cards, such as front -> back and back -> front cards from the same note, do not appear in the same session/day.
- Anki now supports FSRS, the Free Spaced Repetition Scheduler, as an alternative to legacy SM-2. FSRS models memory more directly and uses desired retention as the main user-facing control.
- `ts-fsrs` is a TypeScript package for building spaced-repetition systems with FSRS and is suitable for a React/Vite app.

References:

- Anki background: https://docs.ankiweb.net/background.html
- Anki deck options, display order, burying, FSRS: https://docs.ankiweb.net/deck-options.html
- Anki studying and answer buttons: https://docs.ankiweb.net/studying.html
- `ts-fsrs`: https://www.npmjs.com/package/ts-fsrs
- Open Spaced Repetition / FSRS: https://github.com/open-spaced-repetition/fsrs-rs

## Guiding Principles

1. **Mix means one global pool.**
   - When the user selects all active decks, the queue should not be built as a visible deck traversal.
   - Decks are sources of candidates, not sequential chapters.

2. **Scheduling and queueing are different concerns.**
   - Scheduling decides when a card becomes due.
   - Queueing decides which eligible card is shown next.
   - These should be separate modules and mental models.

3. **Daily review should be trustworthy.**
   - A serious review session should respect due dates.
   - Practice/cram should be separate so casual drilling does not corrupt the spaced-repetition schedule.

4. **Language learning needs extra rules.**
   - Recognition and production are different skills.
   - Production cards are harder and should be introduced more carefully.
   - Reverse-direction siblings should not spoil each other.
   - Tags and examples should support variety and context.

5. **The app should explain itself.**
   - Users should understand whether a card is new, due, overdue, learning, weak, or practice-only.
   - Rating buttons should eventually preview next intervals.

6. **Prefer incremental improvements.**
   - The first improvement should make Mix feel better without a risky scheduler rewrite.
   - FSRS should be added behind an adapter after the queue policy is cleaner.

## Desired End-State

When the user studies in Mix mode with multiple decks enabled:

- Cards are drawn from all enabled decks in a varied order.
- Due reviews are prioritized over new cards.
- New cards are introduced gradually and fairly across active decks.
- Failed cards come back sooner.
- Known cards disappear for longer.
- Reverse-direction siblings are not shown too close together.
- Production cards are paced more conservatively than recognition cards.
- The session can end with a clear "done for today" feeling.
- The user can do optional extra practice without damaging the SRS schedule.

## Phase 1: Smart Mix Queue Without Scheduler Rewrite

### Goal

Make Mix immediately feel global, varied, and intentional while keeping the existing `CardStateRecord` and simple scheduler.

This is the highest-value and lowest-risk phase.

Status: **partially implemented**.

Implemented:

- Balanced new-card selection across active deck buckets.
- Seeded shuffle for new cards so new cards no longer follow strict deck/file order.
- Weighted global queue selection for the final study queue.
- Review preference so due reviews are still favored over new cards.
- Same-deck and same-tag score penalties to reduce visible streaks.
- Existing session-local mixed-note burying remains in place.

Still pending:

- Dedicated tests for queue distribution and same-deck streak reduction.
- More tuning after real-device study sessions.

### Motivation

The biggest current pain is not the exact interval math. It is that Mix does not feel like Mix. If the user enables several decks, they want a pleasant stream of useful cards from across the enabled material. This can be improved before changing the scheduler.

### Scope

- Replace deterministic final deck interleaving with weighted global selection.
- Balance new-card selection across active decks.
- Keep due reviews before new cards, but support controlled interleaving.
- Penalize same-deck and same-tag repetition.
- Preserve existing session-local sibling burying.
- Keep current grade scheduling behavior.

### Proposed Queue Pipeline

1. Collect eligible candidates.
2. Classify candidates into buckets:
   - due learning/relearning cards,
   - due review cards,
   - new cards.
3. Select new cards according to a balanced deck policy.
4. Score review cards.
5. Compose a session queue with weighted sampling without replacement.
6. Return a stable queue for the current render cycle.

### Candidate Collection

Candidate filters:

- Deck must be in active deck scope.
- Direction must match selected direction, unless direction is `mixed`.
- Card must not be buried for this session.
- Later phases will also filter suspended or persistently buried cards.

### Review Scoring

A simple first version can score cards like this:

```ts
score = 10
score += overdueDays * 2
score += lapses * 3
if (intervalDays <= 1) score += 2
if (sameDeckAsPreviousCard) score *= 0.5
if (sharesTagWithRecentCards) score *= 0.75
```

Then choose cards using weighted sampling without replacement.

### New Card Selection

Use balanced deck sampling first:

- Compute active decks with eligible new cards.
- Divide the session new-card limit across those decks.
- Randomize within each deck.
- Merge selected new cards into the session plan.

Example:

- 4 active decks.
- 12 new cards allowed.
- Start with up to 3 new cards from each deck.
- If a deck has fewer than 3 eligible cards, redistribute the remainder.

This is easy to explain:

> Mix introduces new cards evenly from your active decks.

### Session Composition

Default pattern when reviews are manageable:

```text
Review, Review, New, Review, Review, New, ...
```

If there is a review backlog:

```text
Review, Review, Review, Review, New, ...
```

If the backlog is severe, consider reviews-only until the user catches up.

### Implementation Notes

Likely new files:

- `src/lib/queuePolicy.ts`
- `src/lib/weightedSample.ts`

Likely changed file:

- `src/lib/studyQueue.ts`

Possible types:

```ts
type QueueCandidate = {
  card: LibraryCard;
  direction: CardDirection;
  state?: CardStateRecord;
  dueAt: string;
  reps: number;
  lapses: number;
  intervalDays: number;
  isDue: boolean;
  isNew: boolean;
  bucket: 'learning' | 'review' | 'new';
};

type QueuePolicy = {
  newCardMix: 'interleaved' | 'afterReviews';
  avoidSameDeckBackToBack: boolean;
  avoidSameTagBackToBack: boolean;
  newCardsPerSession: number;
  reviewCardsPerSession?: number;
};
```

### Acceptance Criteria

- With multiple active decks, Mix visibly pulls from all active decks.
- New cards are not consumed deck-by-deck.
- Due review cards remain prioritized.
- Same deck should not appear repeatedly when alternatives exist.
- Existing tests/build continue to pass.
- The queue remains deterministic enough for React rendering within one queue calculation, but varied across sessions/days.

### Non-Goals

- No FSRS yet.
- No DB migration yet.
- No persistent bury/suspend yet.
- No major UI redesign yet.

## Phase 2: Explicit Review And Practice Modes

### Goal

Separate serious spaced-repetition review from casual drilling.

### Motivation

Users need two different experiences:

1. **Review mode**: "Tell me what I am due to review today, update the schedule, and let me finish."
2. **Practice mode**: "Let me drill extra vocabulary from active decks without necessarily changing due dates."

Mix can exist in both, but they should not mean the same thing.

### Review Mode

Review mode should:

- Show due learning/review cards.
- Introduce a limited number of new cards.
- Apply grades to the scheduler.
- Respect daily limits.
- End with a clear completion state.

### Practice Mode

Practice mode should:

- Allow drilling beyond due cards.
- Offer sources such as:
  - weak cards,
  - new/unseen cards,
  - all active cards,
  - selected deck,
  - selected tags later.
- Default to not changing SRS due dates.
- Optionally allow "apply grades to schedule" later, but only if explicitly enabled.

### New Settings

Possible settings:

```ts
type SettingsRecord = {
  dailyNewLimit: number;
  dailyReviewLimit: number;
  newCardsPerSession: number;
  reviewCardsPerSession: number;
  defaultStudyMode: 'review' | 'practice';
};
```

### UI Concepts

Study screen mode selector:

- `Review`
- `Practice`

Review can keep the current serious card flow. Practice can start as a small set of options:

- All active cards
- Weak cards
- New cards

### Acceptance Criteria

- Review mode only shows due + allowed new cards.
- Practice mode can show extra cards when review mode says done.
- Practice reviews are either not stored as SRS reviews or are clearly marked as practice-only.
- The user can understand the difference from the UI copy.

## Phase 3: Persistent Bury, Suspend, And Sibling Rules

### Goal

Prevent fake recall and give the user control over annoying or bad cards.

### Motivation

For language cards, immediate reverse-direction exposure is harmful. If the app shows `waar -> where` and then immediately asks `where -> waar`, the second answer is not real recall. It is short-term echo.

The current app already has session-local burying in mixed direction mode. This should become a first-class scheduling concept.

### Features

- Bury card until tomorrow.
- Bury note until tomorrow.
- Suspend card indefinitely.
- Suspend note indefinitely.
- Automatically bury siblings after reviewing one card from a note.

### Data Model Options

Simple option inside `CardStateRecord`:

```ts
type CardStateRecord = {
  buriedUntil?: string;
  suspended?: boolean;
};
```

More flexible option:

```ts
type CardVisibilityRecord = {
  id?: number;
  cardId?: string;
  noteId?: string;
  hiddenUntil?: string;
  suspended: boolean;
  reason: 'manual' | 'sibling' | 'leech' | 'contentIssue';
  createdAt: string;
};
```

Recommendation: start with fields on `CardStateRecord` unless note-level burying becomes awkward.

### Sibling Policy

Default:

- After reviewing one card from a note, bury sibling cards until tomorrow.
- In mixed direction mode, this applies to both new and review siblings.
- Do not bury learning cards that are due within minutes, unless we intentionally decide otherwise.

### Acceptance Criteria

- Reverse direction is not shown on the same day after the forward direction.
- User can manually bury a card/note until tomorrow.
- User can suspend a card/note and it disappears from review/practice.
- Suspended cards are visible somewhere in deck details or stats later.

## Phase 4: FSRS Scheduler Adapter

### Goal

Upgrade from the simple interval scheduler to a modern spaced-repetition scheduler while keeping the app architecture stable.

### Motivation

The existing scheduler is understandable and useful, but it is hand-rolled. It does not model memory stability, difficulty, or retrievability. FSRS is now widely used in the Anki ecosystem and gives a better conceptual foundation for long-term scheduling.

The important architectural decision is not "replace everything with FSRS everywhere". It is:

> Put scheduling behind an adapter so the app can support a simple scheduler and an FSRS scheduler safely.

### Package

Candidate package:

- `ts-fsrs`: https://www.npmjs.com/package/ts-fsrs

Reasons:

- TypeScript package.
- Designed for building spaced-repetition systems.
- Fits React/Vite app architecture.
- Avoids hand-maintaining complex scheduler math.

### Scheduler Settings

User-facing settings should stay minimal:

```ts
type SchedulerSettings = {
  algorithm: 'simple-v1' | 'fsrs-v1';
  desiredRetention: number; // default 0.9
};
```

Do not expose raw FSRS parameters in early UI.

### Data Model

Add fields for FSRS state while preserving old fields during migration:

```ts
type CardStateRecord = {
  cardId: string;
  deckId: string;
  scheduler: 'simple-v1' | 'fsrs-v1';
  status: 'new' | 'learning' | 'review' | 'relearning';
  dueAt: string;
  intervalDays: number;
  ease?: number;
  reps: number;
  lapses: number;
  lastReviewedAt?: string;

  fsrs?: {
    due: string;
    stability?: number;
    difficulty?: number;
    elapsedDays?: number;
    scheduledDays?: number;
    retrievability?: number;
    state?: number;
  };
};
```

Exact field names should follow the chosen `ts-fsrs` object shape where practical.

### Adapter Shape

```ts
export function scheduleNextReview(
  previousState: CardStateRecord,
  rating: Rating,
  reviewedAt: Date,
  settings: SchedulerSettings,
): CardStateRecord {
  if (settings.algorithm === 'fsrs-v1') {
    return scheduleWithFsrs(previousState, rating, reviewedAt, settings);
  }

  return scheduleWithSimpleV1(previousState, rating, reviewedAt);
}
```

### Rating Mapping

Map current ratings:

- `again` -> FSRS Again
- `hard` -> FSRS Hard
- `good` -> FSRS Good
- `easy` -> FSRS Easy

### Migration Strategy

Database version upgrade:

- Existing cards keep `scheduler: 'simple-v1'` initially, or are migrated lazily.
- New installations can default to `fsrs-v1` after testing.
- Existing reviewed cards can be initialized into FSRS from current due/interval state, but do not overfit the migration.
- Review history remains stored.

Simple approach:

- New cards: create empty FSRS card.
- Existing cards: initialize FSRS state on next review using available interval/reps/lapses, accepting that it will become more accurate over time.

### Acceptance Criteria

- All four ratings produce sensible next due dates.
- Desired retention setting affects intervals.
- Review records still support undo.
- Export/import includes scheduler version and FSRS state.
- Existing users do not lose progress.
- The app can still fall back to `simple-v1` if needed.

## Phase 5: Language-Specific Learning Rules

### Goal

Make the app better than a generic flashcard tool for Dutch-English learning.

### Motivation

Generic spaced repetition is useful, but language learning has special structure. Recognition and production are different. Seeing a translation one way can spoil the other way. Some cards need examples, articles, accepted variants, or pronunciation more than others.

### Recognition Before Production

Default policy:

- Introduce Dutch -> English before English -> Dutch.
- Do not introduce production until recognition has succeeded at least once or twice.

Example eligibility rule:

```ts
function isProductionCardEligible(card, siblingState) {
  if (card.direction !== 'en-nl') return true;
  return siblingState?.reps >= 2 || siblingState?.status === 'review';
}
```

### Direction-Specific Pacing

Production cards are harder. Options:

- Introduce fewer new English -> Dutch cards per session.
- Use slightly more conservative scheduling for production.
- Set higher desired retention for production later.

Initial simple rule:

- New production cards are eligible only after recognition sibling has some history.

### Tag-Aware Variety

Avoid repetitive clusters:

- Too many number cards in a row.
- Too many question words in a row.
- Too many similar grammar items in a row.

Queue penalty:

```ts
if (candidate.tags.some(tag => recentTags.includes(tag))) {
  score *= 0.75;
}
```

### Weakness Practice

Use review history to identify weak cards:

- high lapse count,
- repeated `again`,
- low retention by tag,
- slow response time.

Practice mode can include:

- Weak words
- Weak production cards
- Weak tags

### Leech Handling

If a card is failed repeatedly:

- Mark as leech/trouble card.
- Show a small warning.
- Offer actions:
  - keep reviewing,
  - bury for now,
  - suspend,
  - report/edit later.

Suggested first threshold:

```ts
lapses >= 5
```

### Acceptance Criteria

- Production cards do not appear too early.
- Mix avoids obvious same-tag streaks when alternatives exist.
- Weak-card practice can be started separately from daily review.
- Repeatedly failed cards become visible as trouble cards rather than silently annoying the user.

## Phase 6: Study Interaction Modes And Mobile Controls

### Goal

Make the physical act of studying on a phone smoother, more consistent, and more thumb-friendly.

### Motivation

The current study card contains the reveal button and rating buttons inside the card layout. Because card content can have different heights, the vertical position of the primary action changes from card to card. On mobile, this creates friction: the user's thumb cannot build reliable muscle memory because the "Reveal answer" button and the `Again / Hard / Good / Easy` buttons move around.

The study interaction should feel stable. The card content can change, but the action zone should stay in a predictable place.

There are two complementary modes worth supporting:

1. **Fixed controls mode**: keep visible action buttons, but pin them to a consistent bottom action area above the app tabs.
2. **Swipe mode**: remove most visible grading buttons and let the user reveal/grade with gestures.

Both modes should be selectable in Settings because users differ: some prefer explicit buttons, others prefer fast gesture-driven review.

Status: **partially implemented**.

Implemented:

- `studyInteractionMode` setting with `fixed-buttons` as the default.
- Settings UI for `Buttons` vs `Swipe`.
- Fixed bottom action dock above the bottom tabs.
- Reveal and rating controls move out of the card in fixed-buttons mode.
- Extra bottom padding so the dock does not cover card content.
- Hidden-card prompt centering fixed after introducing the action dock.
- Swipe mode now removes reveal/rating buttons from the card flow.
- Tap-to-reveal behavior in swipe mode.
- Interactive pointer-based swipe gestures after reveal.
- Card movement, rotation, color feedback, and exit animation while swiping.
- Directional swipe labels and active rating feedback.
- Current swipe mapping: left `Again`, up `Hard`, down `Good`, right `Easy`.
- Swipe-mode metadata simplified to reduce visual clutter.
- Passive `Tap to reveal` / `Swipe to grade` pills removed; feedback now appears only while swiping.
- Swipe labels are dimmed and only appear during an active swipe, reducing overlaps with prompt/audio elements.
- Revealed swipe cards now use a two-zone prompt/answer split instead of trying to keep the prompt vertically centered.
- Swipe-mode card height and answer/example spacing tuned to reduce unnecessary page scrolling.

Still pending:

- Real-device tuning for thresholds and vertical-scroll conflicts.
- Optional snackbar/toast after swipe grading.
- Interval previews on the fixed action dock and swipe hints.

### Current UI Issue

The current implementation renders:

- `Reveal answer` inside `.study-card` when the answer is hidden.
- The `.rating-grid` inside `.study-card` after reveal.
- The bottom tab bar is fixed at the bottom of the viewport.

This means the study card's internal content determines where the controls appear. Cards with examples, notes, or longer answers move the buttons to different heights.

### Interaction Mode Setting

Add a user setting:

```ts
type StudyInteractionMode = 'fixed-buttons' | 'swipe';

type SettingsRecord = {
  studyInteractionMode: StudyInteractionMode;
};
```

Default recommendation:

```ts
studyInteractionMode: 'fixed-buttons'
```

Rationale:

- Fixed buttons are more discoverable.
- Fixed buttons preserve accessibility.
- Swipe mode can be introduced as a power-user option once the button mode is stable.

### Mode A: Fixed Bottom Controls

In fixed controls mode, the primary study actions live in a bottom action dock above the bottom navigation.

Before reveal:

```text
[ Reveal answer ]
```

After reveal:

```text
[ Again ] [ Hard ] [ Good ] [ Easy ]
```

The dock should:

- Be fixed or sticky near the bottom of the viewport.
- Sit above the existing bottom tab bar.
- Respect `env(safe-area-inset-bottom)`.
- Use a blurred/translucent surface consistent with the bottom nav.
- Keep buttons at a stable height across cards.
- Add enough bottom padding to `.app-content` / `.study-screen` so content is not hidden behind the dock.

Possible CSS direction:

```css
.study-action-dock {
  position: fixed;
  right: 0;
  bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));
  left: 0;
  z-index: 19;
  width: min(100%, 760px);
  margin: 0 auto;
  padding: 0.6rem 0.8rem;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  border-top: 1px solid color-mix(in srgb, var(--foreground) 8%, transparent);
  backdrop-filter: blur(18px);
}
```

Implementation note: because the bottom nav already has fixed positioning and safe-area padding, the action dock should ideally share layout variables with it rather than hardcoding magic numbers.

### Fixed Controls Design Details

Important details:

- The reveal button and the grading grid should use the same container height where possible.
- The button row should be reachable by thumb without covering too much of the card.
- The dock should collapse when there is no current card.
- The dock should not appear on non-study tabs.
- The dock should not block examples or answer content; the screen needs extra bottom padding.
- The answer state should reset as it does today when the current card changes.

Recommended layout:

```tsx
<main className="screen study-screen study-screen--fixed-actions">
  <StudyCard />
  <StudyActionDock>
    {!revealed ? <RevealButton /> : <RatingButtons />}
  </StudyActionDock>
</main>
```

The `StudyCard` should contain prompt, answer, examples, notes, audio, and metadata, but not the primary action buttons.

### Mode B: Swipe-Based Review

Swipe mode should make the card itself the main control surface.

Basic flow:

1. Tap card to reveal answer.
2. After reveal, swipe to grade.
3. The card animates in the swipe direction and the next card appears.

Proposed gesture mapping:

```text
Tap hidden card: Reveal answer
Swipe left: Again / Repeat
Swipe up: Hard
Swipe right: Easy
Swipe down: Good
```

Alternative mapping to consider:

```text
Swipe left: Again
Swipe down: Hard
Swipe up: Good
Swipe right: Easy
```

The exact mapping should be tested because it must feel natural. A possible mental model:

- Left = send back / failed / again.
- Right = move forward / easy.
- Up = effortful but successful / good.
- Down = not great / hard.

However, the user mentioned left/right/up/down in exploratory terms, so the plan should keep this configurable or at least open until prototyping.

### Swipe Mode Discoverability

Swipe-only interactions can be invisible. Add lightweight hints:

- First-time overlay: "Tap to reveal. After reveal, swipe to grade."
- Small directional labels around the card after reveal:
  - left: Again
  - up: Hard
  - right: Easy
  - down: Good
- Optional settings screen diagram.
- Haptic-like visual feedback while dragging.

### Swipe Feedback

During drag:

- Move and rotate the card slightly with the pointer.
- Show the active rating label and color as the drag crosses a threshold.
- Do not grade until the threshold is crossed and the pointer is released.
- Snap back if below threshold.

Example thresholds:

```ts
const minSwipeDistance = 72;
const minSwipeVelocity = 0.35;
```

Use both distance and velocity so quick intentional flicks work.

### Swipe Implementation Notes

Use pointer events rather than separate mouse/touch handlers:

- `onPointerDown`
- `onPointerMove`
- `onPointerUp`
- `onPointerCancel`

Track:

```ts
type SwipeState = {
  pointerId?: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startedAt: number;
};
```

Derive:

```ts
const dx = currentX - startX;
const dy = currentY - startY;
const absX = Math.abs(dx);
const absY = Math.abs(dy);
```

Direction:

```ts
if (absX > absY) {
  direction = dx < 0 ? 'left' : 'right';
} else {
  direction = dy < 0 ? 'up' : 'down';
}
```

Then map direction to rating.

### Guardrails For Swipe Mode

Swipe mode should avoid accidental grading:

- Before reveal, swipes should not grade. They may either do nothing or reveal only on tap.
- After reveal, require a clear distance/velocity threshold.
- Allow undo to remain visible in the header.
- Consider a brief toast/snackbar after grading: "Marked Good · Undo".
- Do not conflict with page scrolling when answer content is long. Vertical swipes may be ambiguous.

The vertical-swipe conflict is the main UX risk. If long answers/examples need scrolling, vertical grading gestures can interfere. Possible mitigations:

1. Only allow horizontal swipes for grading in v1 of swipe mode.
2. Use vertical gestures only when the card content is not scrollable.
3. Require swipe to start from a non-scrollable card surface area.
4. Let the user configure gestures.

Recommendation: prototype four-direction swipe, but be willing to ship horizontal-only first if vertical gestures feel bad.

### Accessibility And Fallbacks

Even in swipe mode, there should be an accessible fallback:

- keyboard shortcuts,
- optional small overflow action menu,
- ability to switch back to fixed buttons,
- ARIA labels and visible focus states.

Swipe-only UI is not enough for accessibility.

Keyboard mapping:

```text
Space / Enter: Reveal
1: Again
2: Hard
3: Good
4: Easy
ArrowLeft: Again
ArrowUp: Hard or Good, depending final mapping
ArrowRight: Easy
ArrowDown: Good or Hard, depending final mapping
```

### Settings UI

Add a setting under Study preferences:

```text
Study controls
( ) Fixed buttons
    Stable bottom controls above tabs. Best for clarity.
( ) Swipe gestures
    Tap to reveal, then swipe the card to grade. Best for speed.
```

Later advanced option:

```text
Swipe mapping
- Classic: left Again, down Hard, up Good, right Easy
- Fast: left Again, up Hard, down Good, right Easy
```

But do not add mapping customization until there is real need.

### Relationship To Other Phases

This phase can be implemented before or after Smart Mix.

Recommended order:

1. Fixed bottom controls can be implemented early because it solves a current mobile usability issue.
2. Swipe mode should come after fixed controls or behind an experimental setting.
3. Rating interval previews from the explainability phase should appear in the fixed dock and in swipe hints.

### Acceptance Criteria

Fixed bottom controls:

- Reveal and rating buttons stay at the same screen height across cards.
- The controls sit above the bottom tab bar and safe area.
- Card content is not hidden behind controls.
- The study screen remains usable on small mobile screens.

Swipe mode:

- User can tap to reveal and swipe to grade.
- Gesture threshold prevents accidental grades.
- Visual feedback clearly shows the pending rating.
- Undo still works.
- User can switch back to fixed buttons in settings.
- Swipe mode does not make long answer/example content frustrating to scroll.

## Phase 7: Explainability And Study UI Feedback

### Goal

Make the study experience more understandable and satisfying.

### Motivation

Spaced repetition can feel opaque. Users trust it more when the app explains why a card appears and what their rating choice will do.

### UI Additions

Card metadata labels:

- New
- Learning
- Due review
- Overdue
- Weak card
- Practice only
- Recognition
- Production

Examples:

```text
Questions · English -> Dutch · Production · Due review
Numbers · Dutch -> English · Recognition · New
```

Rating button interval previews:

```text
Again 10m
Hard 1d
Good 3d
Easy 6d
```

Completion states:

- "You're done for today."
- "You have 8 extra practice cards available."
- "3 reviews were postponed by the daily limit."

### Acceptance Criteria

- User can tell why the current card is being shown.
- User can see or infer what each rating will do.
- End-of-session state feels intentional rather than empty.

## Visual And Interaction Ideas

This section collects concrete visual/product ideas that can be layered into the phases above.

### Fixed Bottom Study Controls

Motivation:

- The primary action buttons should not jump vertically from card to card.
- Mobile users should be able to build thumb muscle memory.
- The reveal button and rating buttons should live in a stable action zone above the bottom tabs.

Expected behavior:

- Before reveal: one fixed `Reveal answer` button.
- After reveal: fixed `Again / Hard / Good / Easy` buttons in the same bottom action area.
- The study card scrolls or resizes above the dock; the dock remains stable.

### Swipe Study Mode

Motivation:

- Some users will want a faster, more physical card flow with fewer visible buttons.
- Swipe gestures can make study feel lighter and more app-like.

Expected behavior:

- Tap card to reveal.
- Swipe after reveal to grade.
- Show directional labels and color feedback while dragging.
- Keep Undo available.
- Make this optional in Settings.

Potential mapping:

```text
Left: Again
Up: Hard
Down: Good
Right: Easy
```

The exact mapping should be validated in a prototype.

### Other Visual Areas To Expand Later

- Study card layout and motion.
- Progress indicators.
- Deck mixing visualization.
- Review forecast visualization.
- More satisfying answer reveal and grading transitions.
- Visual distinction between recognition and production.
- Visual state for weak cards, overdue cards, and new cards.

## Suggested Implementation Order

1. **Phase 1: Smart Mix Queue**
   - Biggest immediate UX win.
   - No DB migration.
   - Low risk.

2. **Phase 2: Review vs Practice Modes**
   - Clarifies product model.
   - Protects SRS data from casual drilling.

3. **Phase 3: Persistent Bury/Suspend**
   - Prevents fake recall.
   - Gives user control.

4. **Phase 4: FSRS Adapter**
   - Modernizes scheduling.
   - Requires DB migration and careful testing.

5. **Phase 5: Language-Specific Rules**
   - Makes the app feel purpose-built for language learning.

6. **Phase 6: Study Interaction Modes And Mobile Controls**
   - Stabilizes mobile controls and supports fast gesture-based study.

7. **Phase 7: Explainability/UI Feedback**
   - Builds trust and improves perceived quality.

Visual improvements can be layered across phases, especially after Phase 1 clarifies what state the UI needs to represent. Fixed bottom controls are valuable enough to implement early, even before the deeper scheduler work.

## Open Questions

1. Should Mix always be smart/global, or should there also be an explicit deterministic deck-by-deck mode?
2. Should daily limits be global only, or configurable per deck later?
3. Should practice mode ever update the SRS schedule by default? Proposed answer: no.
4. Should production cards use a separate desired retention setting once FSRS exists?
5. Should sibling burying last until tomorrow, or should production siblings wait longer than one day?
6. Should new cards be balanced equally by deck, or weighted by deck size/priority?
7. How much randomness is desirable? Fully random may feel chaotic; weighted smart random should feel varied but guided.
8. Should the app include an explicit "I already know this" flow for easy new cards?
9. Should fixed bottom controls be the default study interaction on mobile? Proposed answer: yes.
10. Should swipe mode support four directions, or should v1 start with safer horizontal-only gestures?
11. What swipe mapping feels most natural: left/right only, or left/up/down/right mapped to all four ratings?
12. Should swipe mapping be configurable, or should the app keep one opinionated default?

## Success Metrics

Qualitative:

- Mix no longer feels like deck traversal.
- Sessions feel varied but not chaotic.
- The user trusts that difficult cards return and easy cards disappear.
- The user understands when they are done for the day.
- Primary controls feel stable on mobile and do not jump between cards.
- Swipe mode, if enabled, feels fast without causing accidental grades.

Quantitative candidates:

- Reviews completed per session.
- Session completion rate.
- Average cards studied before exit.
- Retention by direction.
- Lapse rate by deck/tag.
- Number of same-deck streaks in Mix.
- Number of same-note sibling collisions per day; target should be zero after persistent burying.
- Accidental undo rate after swipe grading.
- Percentage of study sessions using fixed controls vs swipe mode.

## Notes On Scope

This plan should not turn gracht.app into full Anki. The target is a focused, mobile-first Dutch learning PWA with enough scheduling intelligence to be genuinely useful. Full Anki compatibility, cloud sync, complex deck presets, add-ons, and advanced optimizer UI remain out of scope unless explicitly reprioritized later.
