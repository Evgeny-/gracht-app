import { Check, ChevronDown, RotateCcw, Volume2 } from 'lucide-react';
import type { CSSProperties, PointerEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { SegmentedControl } from '../components/SegmentedControl';
import { deckLibrary } from '../decks/library';
import type { CardDirection, StudyDirection } from '../decks/types';
import type { CardStateRecord, DatabaseSnapshot } from '../lib/db';
import { type Rating } from '../lib/scheduler';
import { speakDutch } from '../lib/speech';
import { buildStudyQueue, getAnswer, getDutchText, getPrompt } from '../lib/studyQueue';

type StudyScreenProps = {
  snapshot: DatabaseSnapshot;
  activeDeckIds: string[];
  stateMap: Map<string, CardStateRecord>;
  onGrade: (
    cardId: string,
    deckId: string,
    direction: CardDirection,
    rating: Rating,
    responseMs: number,
  ) => Promise<void>;
  onUndo: () => Promise<void>;
};

const directionOptions: { value: StudyDirection; label: string }[] = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'nl-en', label: 'NL -> EN' },
  { value: 'en-nl', label: 'EN -> NL' },
];

const ratingButtons: { rating: Rating; label: string; tone: 'danger' | 'secondary' | 'success' | 'primary' }[] = [
  { rating: 'again', label: 'Again', tone: 'danger' },
  { rating: 'hard', label: 'Hard', tone: 'secondary' },
  { rating: 'good', label: 'Good', tone: 'success' },
  { rating: 'easy', label: 'Easy', tone: 'primary' },
];

type SwipeDirection = 'left' | 'right' | 'up' | 'down';

type SwipeState = {
  pointerId?: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startedAt: number;
  isDragging: boolean;
  isExiting: boolean;
  exitDirection?: SwipeDirection;
};

const swipeRatingMap: Record<SwipeDirection, { rating: Rating; label: string; className: string }> = {
  left: { rating: 'again', label: 'Again', className: 'again' },
  up: { rating: 'hard', label: 'Hard', className: 'hard' },
  down: { rating: 'good', label: 'Good', className: 'good' },
  right: { rating: 'easy', label: 'Easy', className: 'easy' },
};

const swipeThreshold = 72;
const swipeExitDistance = 520;

function getSwipeDirection(deltaX: number, deltaY: number): SwipeDirection {
  return Math.abs(deltaX) >= Math.abs(deltaY) ? (deltaX < 0 ? 'left' : 'right') : deltaY < 0 ? 'up' : 'down';
}

function clampSwipeOffset(value: number) {
  return Math.max(-140, Math.min(140, value));
}

export function StudyScreen({ snapshot, activeDeckIds, stateMap, onGrade, onUndo }: StudyScreenProps) {
  const [direction, setDirection] = useState<StudyDirection>(snapshot.settings.defaultDirection);
  const [deckScope, setDeckScope] = useState<'active' | string>('active');
  const [revealed, setRevealed] = useState(false);
  const [sessionReviews, setSessionReviews] = useState(0);
  const [buriedMixedNoteIds, setBuriedMixedNoteIds] = useState<Set<string>>(() => new Set());
  const [startedAt, setStartedAt] = useState(() => performance.now());
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startedAt: 0,
    isDragging: false,
    isExiting: false,
  });
  const interactionMode = snapshot.settings.studyInteractionMode;
  const useFixedControls = interactionMode === 'fixed-buttons';
  const useSwipeMode = interactionMode === 'swipe';

  const queue = useMemo(
    () =>
      buildStudyQueue(
        activeDeckIds,
        stateMap,
        direction,
        deckScope,
        snapshot.settings.newCardsPerSession,
        buriedMixedNoteIds,
      ),
    [activeDeckIds, buriedMixedNoteIds, deckScope, direction, snapshot.settings.newCardsPerSession, stateMap],
  );
  const current = queue[0];

  useEffect(() => {
    setRevealed(false);
    setStartedAt(performance.now());
    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      startedAt: 0,
      isDragging: false,
      isExiting: false,
    });
  }, [current?.card.id, current?.direction]);

  useEffect(() => {
    setBuriedMixedNoteIds(new Set());
  }, [deckScope, direction]);

  function revealCurrentCard() {
    if (!revealed && !swipeState.isDragging && !swipeState.isExiting) {
      setRevealed(true);
    }
  }

  async function handleGrade(rating: Rating) {
    if (!current) {
      return;
    }

    await onGrade(
      current.card.id,
      current.card.deckId,
      current.direction,
      rating,
      Math.round(performance.now() - startedAt),
    );
    if (direction === 'mixed') {
      setBuriedMixedNoteIds((noteIds) => new Set(noteIds).add(current.card.noteId));
    }
    setSessionReviews((count) => count + 1);
    setRevealed(false);
    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      startedAt: 0,
      isDragging: false,
      isExiting: false,
    });
  }

  async function handleUndo() {
    await onUndo();
    setBuriedMixedNoteIds(new Set());
    setSessionReviews((count) => Math.max(0, count - 1));
    setRevealed(false);
    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      startedAt: 0,
      isDragging: false,
      isExiting: false,
    });
  }

  function handleSwipePointerDown(event: PointerEvent<HTMLElement>) {
    if (!useSwipeMode || !current || swipeState.isExiting) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setSwipeState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      startedAt: performance.now(),
      isDragging: true,
      isExiting: false,
    });
  }

  function handleSwipePointerMove(event: PointerEvent<HTMLElement>) {
    if (!useSwipeMode || !swipeState.isDragging || swipeState.pointerId !== event.pointerId) {
      return;
    }

    setSwipeState((state) => ({
      ...state,
      currentX: event.clientX,
      currentY: event.clientY,
    }));
  }

  function resetSwipeState() {
    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      startedAt: 0,
      isDragging: false,
      isExiting: false,
    });
  }

  function handleSwipePointerEnd(event: PointerEvent<HTMLElement>) {
    if (!useSwipeMode || !swipeState.isDragging || swipeState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - swipeState.startX;
    const deltaY = event.clientY - swipeState.startY;
    const distance = Math.hypot(deltaX, deltaY);

    if (!revealed) {
      if (distance < 12) {
        setRevealed(true);
      }
      resetSwipeState();
      return;
    }

    if (distance < swipeThreshold) {
      resetSwipeState();
      return;
    }

    const swipeDirection = getSwipeDirection(deltaX, deltaY);
    const { rating } = swipeRatingMap[swipeDirection];
    setSwipeState((state) => ({
      ...state,
      currentX: event.clientX,
      currentY: event.clientY,
      isDragging: false,
      isExiting: true,
      exitDirection: swipeDirection,
    }));
    window.setTimeout(() => {
      void handleGrade(rating);
    }, 170);
  }

  function handleSwipePointerCancel() {
    if (!useSwipeMode) {
      return;
    }
    resetSwipeState();
  }

  const swipeDeltaX = swipeState.currentX - swipeState.startX;
  const swipeDeltaY = swipeState.currentY - swipeState.startY;
  const swipeDistance = Math.hypot(swipeDeltaX, swipeDeltaY);
  const activeSwipeDirection = swipeDistance >= 18 ? getSwipeDirection(swipeDeltaX, swipeDeltaY) : undefined;
  const activeSwipeRating = activeSwipeDirection ? swipeRatingMap[activeSwipeDirection] : undefined;
  const clampedSwipeX = swipeState.isExiting
    ? swipeState.exitDirection === 'left'
      ? -swipeExitDistance
      : swipeState.exitDirection === 'right'
        ? swipeExitDistance
        : 0
    : clampSwipeOffset(swipeDeltaX);
  const clampedSwipeY = swipeState.isExiting
    ? swipeState.exitDirection === 'up'
      ? -swipeExitDistance
      : swipeState.exitDirection === 'down'
        ? swipeExitDistance
        : 0
    : clampSwipeOffset(swipeDeltaY);
  const swipeRotation = Math.max(-9, Math.min(9, clampedSwipeX / 18));
  const swipeProgress = Math.min(1, swipeDistance / swipeThreshold);
  const swipeCardStyle = useSwipeMode
    ? ({
        '--swipe-x': `${clampedSwipeX}px`,
        '--swipe-y': `${clampedSwipeY}px`,
        '--swipe-rotate': `${swipeRotation}deg`,
        '--swipe-progress': swipeProgress,
      } as CSSProperties)
    : undefined;

  const activeDecks = deckLibrary.filter((deck) => activeDeckIds.includes(deck.id));
  const showPromptAudio = current?.direction === 'nl-en' && (!useSwipeMode || !revealed);
  const showAnswerAudio = current?.direction === 'en-nl' && (!useSwipeMode || revealed);
  const actionControls = !current ? null : !revealed ? (
    <button className="reveal-button" type="button" onClick={() => setRevealed(true)}>
      Reveal answer
    </button>
  ) : (
    <div className="rating-grid">
      {ratingButtons.map((button) => (
        <Button key={button.rating} tone={button.tone} onClick={() => void handleGrade(button.rating)}>
          {button.label === 'Again' ? <RotateCcw size={17} /> : null}
          {button.label}
        </Button>
      ))}
    </div>
  );

  return (
    <main
      className={`screen study-screen${useFixedControls ? ' study-screen--fixed-actions' : ''}`}
      data-interaction-mode={interactionMode}
    >
      <SectionHeader
        eyebrow="Recall"
        title="Study"
        action={
          <div className="study-header-actions">
            <button
              aria-label="Undo last grade"
              className="icon-button icon-button--compact"
              disabled={snapshot.reviews.length === 0}
              type="button"
              onClick={() => void handleUndo()}
            >
              <RotateCcw size={18} />
            </button>
            <span className="session-pill">{sessionReviews} reviewed</span>
          </div>
        }
      />

      <div className="study-controls">
        <SegmentedControl
          label="Direction"
          options={directionOptions}
          value={direction}
          onChange={setDirection}
        />
        <label className="field">
          <span className="field__label">Deck scope</span>
          <span className="select-shell">
            <select value={deckScope} onChange={(event) => setDeckScope(event.target.value)}>
              <option value="active">All active decks</option>
              {activeDecks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.title}
                </option>
              ))}
            </select>
            <ChevronDown size={17} />
          </span>
        </label>
      </div>

      {!current ? (
        <section className="empty-state">
          <Check size={36} />
          <h2>No due cards here</h2>
          <p>Enable more decks or come back when the scheduler brings cards due again.</p>
        </section>
      ) : (
        <section
          aria-live="polite"
          className="study-card"
          data-clickable={!revealed}
          data-revealed={revealed}
          data-swipe-active={useSwipeMode && (swipeState.isDragging || swipeState.isExiting)}
          data-swipe-mode={useSwipeMode}
          data-swipe-rating={activeSwipeRating?.className}
          style={swipeCardStyle}
          onClick={useSwipeMode ? undefined : revealCurrentCard}
          onPointerCancel={handleSwipePointerCancel}
          onPointerDown={handleSwipePointerDown}
          onPointerMove={handleSwipePointerMove}
          onPointerUp={handleSwipePointerEnd}
        >
          {!useSwipeMode ? (
            <div className="study-card__meta">
              <span>{current.card.deckShortTitle}</span>
              <span>{current.direction === 'nl-en' ? 'Dutch -> English' : 'English -> Dutch'}</span>
            </div>
          ) : null}

          {useSwipeMode && activeSwipeRating ? (
            <div className="swipe-feedback" aria-hidden="true">
              {activeSwipeRating.label}
            </div>
          ) : null}

          {useSwipeMode && revealed && activeSwipeRating ? (
            <div className="swipe-labels" aria-hidden="true">
              <span className="swipe-label swipe-label--left">Again</span>
              <span className="swipe-label swipe-label--up">Hard</span>
              <span className="swipe-label swipe-label--right">Easy</span>
              <span className="swipe-label swipe-label--down">Good</span>
            </div>
          ) : null}

          <div className="study-card__prompt">
            <p>{getPrompt(current)}</p>
            {showPromptAudio ? (
              <button
                aria-label="Speak Dutch prompt"
                className="icon-button"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  speakDutch(getDutchText(current), snapshot.settings.voiceURI);
                }}
              >
                <Volume2 size={22} />
              </button>
            ) : null}
          </div>

          {revealed ? (
            <div className="study-card__answer">
              <span>Answer</span>
              <p>{getAnswer(current)}</p>
              {showAnswerAudio ? (
                <button
                  aria-label="Speak Dutch answer"
                  className="icon-button"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    speakDutch(getDutchText(current), snapshot.settings.voiceURI);
                  }}
                >
                  <Volume2 size={22} />
                </button>
              ) : null}
              {current.card.examples?.length ? (
                <div className="examples">
                  {current.card.examples.map((example) => (
                    <p key={`${example.nl}-${example.en}`}>
                      <strong>{example.nl}</strong>
                      <span>{example.en}</span>
                    </p>
                  ))}
                </div>
              ) : null}
              {current.card.notes ? <small>{current.card.notes}</small> : null}
            </div>
          ) : null}

          {!useFixedControls && !useSwipeMode ? actionControls : null}
        </section>
      )}

      {useFixedControls && actionControls ? <div className="study-action-dock">{actionControls}</div> : null}
    </main>
  );
}
