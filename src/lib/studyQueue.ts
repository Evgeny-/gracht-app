import { allCards, type LibraryCard } from '../decks/library';
import type { CardDirection, StudyDirection } from '../decks/types';
import type { CardStateRecord } from './db';
import { isCardDue } from './scheduler';

export type StudyItem = {
  card: LibraryCard;
  direction: CardDirection;
};

export function buildStudyQueue(
  activeDeckIds: string[],
  stateMap: Map<string, CardStateRecord>,
  direction: StudyDirection,
  deckScope: 'active' | string,
  newCardLimit: number,
  now = new Date(),
): StudyItem[] {
  const scopedDeckIds = deckScope === 'active' ? new Set(activeDeckIds) : new Set([deckScope]);

  const candidates = allCards
    .filter((card) => scopedDeckIds.has(card.deckId))
    .filter((card) => direction === 'mixed' || card.direction === direction)
    .map((card) => {
      const state = stateMap.get(card.id);
      const isNew = !state || state.reps === 0;
      return {
        card,
        direction: card.direction,
        dueAt: state?.dueAt ?? new Date(0).toISOString(),
        reps: state?.reps ?? 0,
        isDue: isNew || isCardDue(state, now),
        isNew,
      };
    })
    .filter((item) => item.isDue);

  const dueReviews = candidates.filter((item) => !item.isNew);
  const newCards = candidates
    .filter((item) => item.isNew)
    .sort((left, right) => left.card.id.localeCompare(right.card.id))
    .slice(0, newCardLimit);

  return [...dueReviews, ...newCards]
    .sort((left, right) => {
      const dueDiff = new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
      if (dueDiff !== 0) {
        return dueDiff;
      }
      return left.reps - right.reps;
    })
    .map(({ card, direction }) => ({ card, direction }));
}

export function getPrompt(item: StudyItem) {
  return item.card.prompt;
}

export function getAnswer(item: StudyItem) {
  return item.card.answer;
}

export function getDutchText(item: StudyItem) {
  return item.card.dutchText;
}
