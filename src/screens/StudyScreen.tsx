import { Check, ChevronDown, RotateCcw, Volume2 } from 'lucide-react';
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

export function StudyScreen({ snapshot, activeDeckIds, stateMap, onGrade, onUndo }: StudyScreenProps) {
  const [direction, setDirection] = useState<StudyDirection>(snapshot.settings.defaultDirection);
  const [deckScope, setDeckScope] = useState<'active' | string>('active');
  const [revealed, setRevealed] = useState(false);
  const [sessionReviews, setSessionReviews] = useState(0);
  const [buriedMixedNoteIds, setBuriedMixedNoteIds] = useState<Set<string>>(() => new Set());
  const [startedAt, setStartedAt] = useState(() => performance.now());

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
  }, [current?.card.id, current?.direction]);

  useEffect(() => {
    setBuriedMixedNoteIds(new Set());
  }, [deckScope, direction]);

  function revealCurrentCard() {
    if (!revealed) {
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
  }

  async function handleUndo() {
    await onUndo();
    setBuriedMixedNoteIds(new Set());
    setSessionReviews((count) => Math.max(0, count - 1));
    setRevealed(false);
  }

  const activeDecks = deckLibrary.filter((deck) => activeDeckIds.includes(deck.id));

  return (
    <main className="screen study-screen">
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
          onClick={revealCurrentCard}
        >
          <div className="study-card__meta">
            <span>{current.card.deckShortTitle}</span>
            <span>{current.direction === 'nl-en' ? 'Dutch -> English' : 'English -> Dutch'}</span>
          </div>

          <div className="study-card__prompt">
            <p>{getPrompt(current)}</p>
            {current.direction === 'nl-en' ? (
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
              {current.direction === 'en-nl' ? (
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
          ) : (
            <button className="reveal-button" type="button" onClick={() => setRevealed(true)}>
              Reveal answer
            </button>
          )}

          {revealed ? (
            <div className="rating-grid">
              {ratingButtons.map((button) => (
                <Button key={button.rating} tone={button.tone} onClick={() => void handleGrade(button.rating)}>
                  {button.label === 'Again' ? <RotateCcw size={17} /> : null}
                  {button.label}
                </Button>
              ))}
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
}
