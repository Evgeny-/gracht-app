import { allCards, deckLibrary } from '../decks/library';
import type { CardDirection } from '../decks/types';
import type { CardStateRecord, DeckPreferenceRecord, ReviewRecord } from './db';
import { isCardDue } from './scheduler';

export type DeckStats = {
  deckId: string;
  title: string;
  shortTitle: string;
  enabled: boolean;
  total: number;
  due: number;
  newCount: number;
  reviewed: number;
  retention: number;
};

export type DailyStat = {
  date: string;
  reviews: number;
  remembered: number;
  retention: number;
};

export function toDateKey(date: Date | string) {
  const nextDate = typeof date === 'string' ? new Date(date) : date;
  return nextDate.toISOString().slice(0, 10);
}

function endOfTomorrow(now = new Date()) {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function buildStateMap(cardStates: CardStateRecord[]) {
  return new Map(cardStates.map((state) => [state.cardId, state]));
}

export function buildDeckPreferenceMap(deckPrefs: DeckPreferenceRecord[]) {
  return new Map(deckPrefs.map((pref) => [pref.deckId, pref.enabled]));
}

export function getActiveDeckIds(deckPrefs: DeckPreferenceRecord[]) {
  const prefMap = buildDeckPreferenceMap(deckPrefs);
  return deckLibrary
    .filter((deck) => prefMap.get(deck.id) ?? deck.defaultEnabled)
    .map((deck) => deck.id);
}

export function supportedDirection(direction: CardDirection, cardDirections: CardDirection[]) {
  return cardDirections.includes(direction);
}

export function deckStats(
  deckPrefs: DeckPreferenceRecord[],
  cardStates: CardStateRecord[],
  reviews: ReviewRecord[],
  newCardLimit = Number.POSITIVE_INFINITY,
  now = new Date(),
): DeckStats[] {
  const prefMap = buildDeckPreferenceMap(deckPrefs);
  const stateMap = buildStateMap(cardStates);

  return deckLibrary.map((deck) => {
    const generatedCards = allCards.filter((card) => card.deckId === deck.id);
    const deckReviews = reviews.filter((review) => review.deckId === deck.id);
    const remembered = deckReviews.filter((review) => review.rating !== 'again').length;
    const total = generatedCards.length;
    const dueReviews = generatedCards.filter((card) => {
      const state = stateMap.get(card.id);
      return state && state.reps > 0 && isCardDue(state, now);
    }).length;
    const newDue = generatedCards.filter((card) => {
      const state = stateMap.get(card.id);
      return !state || state.reps === 0;
    }).length;
    const due = dueReviews + Math.min(newCardLimit, newDue);
    const reviewed = generatedCards.filter((card) => stateMap.get(card.id)?.reps).length;
    const newCount = total - reviewed;

    return {
      deckId: deck.id,
      title: deck.title,
      shortTitle: deck.shortTitle,
      enabled: prefMap.get(deck.id) ?? deck.defaultEnabled,
      total,
      due,
      newCount,
      reviewed,
      retention: deckReviews.length > 0 ? Math.round((remembered / deckReviews.length) * 100) : 0,
    };
  });
}

export function dailyStats(reviews: ReviewRecord[], days = 14, now = new Date()): DailyStat[] {
  const byDate = new Map<string, { reviews: number; remembered: number }>();

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - index);
    byDate.set(toDateKey(date), { reviews: 0, remembered: 0 });
  }

  reviews.forEach((review) => {
    const key = toDateKey(review.reviewedAt);
    const bucket = byDate.get(key);
    if (!bucket) {
      return;
    }
    bucket.reviews += 1;
    if (review.rating !== 'again') {
      bucket.remembered += 1;
    }
  });

  return Array.from(byDate.entries()).map(([date, value]) => ({
    date: date.slice(5),
    reviews: value.reviews,
    remembered: value.remembered,
    retention: value.reviews > 0 ? Math.round((value.remembered / value.reviews) * 100) : 0,
  }));
}

export function globalStats(
  deckPrefs: DeckPreferenceRecord[],
  cardStates: CardStateRecord[],
  reviews: ReviewRecord[],
  newCardLimit = Number.POSITIVE_INFINITY,
  now = new Date(),
) {
  const activeDeckIds = new Set(getActiveDeckIds(deckPrefs));
  const stateMap = buildStateMap(cardStates);
  const activeCards = allCards.filter((card) => activeDeckIds.has(card.deckId));
  const activeStates = cardStates.filter((state) => activeDeckIds.has(state.deckId));
  const todayKey = toDateKey(now);
  const reviewsToday = reviews.filter((review) => toDateKey(review.reviewedAt) === todayKey).length;
  const remembered = reviews.filter((review) => review.rating !== 'again').length;
  const dueReviews = activeCards.filter((card) => {
    const state = stateMap.get(card.id);
    return state && state.reps > 0 && isCardDue(state, now);
  }).length;
  const newDue = activeCards.filter((card) => {
    const state = stateMap.get(card.id);
    return !state || state.reps === 0;
  }).length;
  const due = dueReviews + Math.min(newCardLimit, newDue);
  const tomorrow = endOfTomorrow(now);
  const dueByTomorrow = activeCards.filter((card) => {
    const state = stateMap.get(card.id);
    return state && state.reps > 0 && new Date(state.dueAt).getTime() <= tomorrow.getTime();
  }).length + Math.min(newCardLimit, newDue);

  return {
    activeDecks: activeDeckIds.size,
    activeCards: activeCards.length,
    due,
    dueByTomorrow,
    reviewsToday,
    totalReviews: reviews.length,
    learned: activeStates.filter((state) => state.status === 'review').length,
    newCount: activeCards.length - activeStates.filter((state) => state.reps > 0).length,
    retention: reviews.length > 0 ? Math.round((remembered / reviews.length) * 100) : 0,
    streak: reviewStreak(reviews, now),
  };
}

export function reviewStreak(reviews: ReviewRecord[], now = new Date()) {
  const reviewedDates = new Set(reviews.map((review) => toDateKey(review.reviewedAt)));
  let streak = 0;
  const cursor = new Date(now);

  while (reviewedDates.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
