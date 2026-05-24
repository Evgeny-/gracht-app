import { allCards, type LibraryCard } from '../decks/library';
import type { CardDirection, StudyDirection } from '../decks/types';
import type { CardStateRecord } from './db';
import { isCardDue } from './scheduler';

export type StudyItem = {
  card: LibraryCard;
  direction: CardDirection;
};

type QueueCandidate = {
  card: LibraryCard;
  direction: CardDirection;
  dueAt: string;
  reps: number;
  isDue: boolean;
  isNew: boolean;
};

function hashString(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function buildStudyQueue(
  activeDeckIds: string[],
  stateMap: Map<string, CardStateRecord>,
  direction: StudyDirection,
  deckScope: 'active' | string,
  newCardLimit: number,
  buriedNoteIds = new Set<string>(),
  now = new Date(),
): StudyItem[] {
  const scopedDeckOrder = deckScope === 'active' ? activeDeckIds : [deckScope];
  const scopedDeckIds = new Set(scopedDeckOrder);

  const candidates = allCards
    .filter((card) => scopedDeckIds.has(card.deckId))
    .filter((card) => direction === 'mixed' || card.direction === direction)
    .filter((card) => direction !== 'mixed' || !buriedNoteIds.has(card.noteId))
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

  const directionScopedCandidates = direction === 'mixed' ? pickOneDirectionPerNote(candidates) : candidates;
  const dueReviews = directionScopedCandidates.filter((item) => !item.isNew);
  const newCards = interleaveByDeck(
    directionScopedCandidates.filter((item) => item.isNew),
    scopedDeckOrder,
  ).slice(0, newCardLimit);

  return interleaveByDeck([...dueReviews, ...newCards], scopedDeckOrder, compareStudyPriority).map(
    ({ card, direction }) => ({ card, direction }),
  );
}

function compareStudyPriority(left: QueueCandidate, right: QueueCandidate) {
  if (left.isNew !== right.isNew) {
    return left.isNew ? 1 : -1;
  }

  const dueDiff = new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
  if (dueDiff !== 0) {
    return dueDiff;
  }

  if (left.reps !== right.reps) {
    return left.reps - right.reps;
  }

  return left.card.id.localeCompare(right.card.id);
}

function interleaveByDeck<T extends { card: LibraryCard }>(
  items: T[],
  deckOrder: string[],
  compareItems: (left: T, right: T) => number = (left, right) => left.card.id.localeCompare(right.card.id),
) {
  const buckets = new Map<string, T[]>();

  items.forEach((item) => {
    buckets.set(item.card.deckId, [...(buckets.get(item.card.deckId) ?? []), item]);
  });

  buckets.forEach((bucket) => bucket.sort(compareItems));

  const knownDeckIds = new Set(deckOrder);
  const orderedDeckIds = [
    ...deckOrder.filter((deckId) => buckets.has(deckId)),
    ...Array.from(buckets.keys())
      .filter((deckId) => !knownDeckIds.has(deckId))
      .sort(),
  ];
  const interleaved: T[] = [];

  let addedCard = true;
  while (addedCard) {
    addedCard = false;

    orderedDeckIds.forEach((deckId) => {
      const bucket = buckets.get(deckId);
      const nextCard = bucket?.shift();

      if (nextCard) {
        interleaved.push(nextCard);
        addedCard = true;
      }
    });
  }

  return interleaved;
}

function pickOneDirectionPerNote<T extends { card: LibraryCard; dueAt: string; reps: number; isNew: boolean }>(
  candidates: T[],
) {
  const byNote = new Map<string, T[]>();

  candidates.forEach((candidate) => {
    byNote.set(candidate.card.noteId, [...(byNote.get(candidate.card.noteId) ?? []), candidate]);
  });

  return Array.from(byNote.values()).map((noteCandidates) => {
    const sorted = [...noteCandidates].sort((left, right) => {
      if (left.isNew !== right.isNew) {
        return left.isNew ? 1 : -1;
      }

      const dueDiff = new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
      if (dueDiff !== 0) {
        return dueDiff;
      }

      if (left.reps !== right.reps) {
        return left.reps - right.reps;
      }

      const preferredDirection = hashString(left.card.noteId) % 2 === 0 ? 'nl-en' : 'en-nl';
      if (left.card.direction === preferredDirection) {
        return -1;
      }
      if (right.card.direction === preferredDirection) {
        return 1;
      }

      return left.card.direction.localeCompare(right.card.direction);
    });

    return sorted[0];
  });
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
