import type { CardStateRecord, ReviewRecord } from './db';

export type Rating = 'again' | 'hard' | 'good' | 'easy';
export type CardStatus = 'new' | 'learning' | 'review';

const minute = 60 * 1000;
const day = 24 * 60 * minute;

export function initialCardState(cardId: string, deckId: string): CardStateRecord {
  return {
    cardId,
    deckId,
    status: 'new',
    dueAt: new Date(0).toISOString(),
    intervalDays: 0,
    ease: 2.5,
    reps: 0,
    lapses: 0,
  };
}

export function isCardDue(state: CardStateRecord | undefined, now = new Date()) {
  if (!state || state.status === 'new') {
    return true;
  }
  return new Date(state.dueAt).getTime() <= now.getTime();
}

export function scheduleNextReview(
  previousState: CardStateRecord,
  rating: Rating,
  reviewedAt = new Date(),
): CardStateRecord {
  const reps = previousState.reps + 1;
  const previousInterval = Math.max(previousState.intervalDays, 0);
  let status: CardStatus = 'review';
  let ease = previousState.ease;
  let intervalDays = previousInterval;
  let dueAt = reviewedAt.getTime();
  let lapses = previousState.lapses;

  if (rating === 'again') {
    status = 'learning';
    ease = Math.max(1.3, ease - 0.2);
    intervalDays = 0;
    dueAt += 10 * minute;
    lapses += 1;
  }

  if (rating === 'hard') {
    status = reps <= 1 ? 'learning' : 'review';
    ease = Math.max(1.3, ease - 0.05);
    intervalDays = previousInterval === 0 ? 1 : Math.max(1, Math.round(previousInterval * 1.25));
    dueAt += intervalDays * day;
  }

  if (rating === 'good') {
    intervalDays = previousInterval === 0 ? 1 : Math.max(1, Math.round(previousInterval * ease));
    dueAt += intervalDays * day;
  }

  if (rating === 'easy') {
    ease = Math.min(3.2, ease + 0.15);
    intervalDays = previousInterval === 0 ? 4 : Math.max(2, Math.round(previousInterval * ease * 1.45));
    dueAt += intervalDays * day;
  }

  return {
    ...previousState,
    status,
    dueAt: new Date(dueAt).toISOString(),
    intervalDays,
    ease,
    reps,
    lapses,
    lastReviewedAt: reviewedAt.toISOString(),
  };
}

export function makeReviewRecord(
  previousState: CardStateRecord,
  nextState: CardStateRecord,
  rating: Rating,
  direction: ReviewRecord['direction'],
  responseMs: number,
): ReviewRecord {
  return {
    cardId: nextState.cardId,
    deckId: nextState.deckId,
    direction,
    rating,
    reviewedAt: nextState.lastReviewedAt ?? new Date().toISOString(),
    responseMs,
    previousState,
    previousDueAt: previousState.dueAt,
    nextDueAt: nextState.dueAt,
    intervalDays: nextState.intervalDays,
  };
}
