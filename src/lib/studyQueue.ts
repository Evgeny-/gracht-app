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
  lapses: number;
  intervalDays: number;
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
        lapses: state?.lapses ?? 0,
        intervalDays: state?.intervalDays ?? 0,
        isDue: isNew || isCardDue(state, now),
        isNew,
      };
    })
    .filter((item) => item.isDue);

  const directionScopedCandidates = direction === 'mixed' ? pickOneDirectionPerNote(candidates) : candidates;
  const dueReviews = directionScopedCandidates.filter((item) => !item.isNew);
  const newCards = selectBalancedNewCards(
    directionScopedCandidates.filter((item) => item.isNew),
    scopedDeckOrder,
    newCardLimit,
    now,
  );

  return buildSmartMixedQueue([...dueReviews, ...newCards], scopedDeckOrder, now).map(({ card, direction }) => ({
    card,
    direction,
  }));
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

function seededRandom(seed: string) {
  let state = hashString(seed) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffleWithSeed<T extends { card: LibraryCard }>(items: T[], seed: string) {
  const random = seededRandom(seed);
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function selectBalancedNewCards(
  items: QueueCandidate[],
  deckOrder: string[],
  limit: number,
  now: Date,
) {
  if (limit <= 0 || items.length === 0) {
    return [];
  }

  const buckets = new Map<string, QueueCandidate[]>();
  items.forEach((item) => {
    buckets.set(item.card.deckId, [...(buckets.get(item.card.deckId) ?? []), item]);
  });

  buckets.forEach((bucket, deckId) => {
    buckets.set(bucket[0]?.card.deckId ?? deckId, shuffleWithSeed(bucket, `${toDateSeed(now)}:${deckId}:new`));
  });

  const knownDeckIds = new Set(deckOrder);
  const orderedDeckIds = [
    ...deckOrder.filter((deckId) => buckets.has(deckId)),
    ...Array.from(buckets.keys())
      .filter((deckId) => !knownDeckIds.has(deckId))
      .sort(),
  ];
  const selected: QueueCandidate[] = [];

  while (selected.length < limit) {
    let addedCard = false;

    orderedDeckIds.forEach((deckId) => {
      if (selected.length >= limit) {
        return;
      }

      const bucket = buckets.get(deckId);
      const nextCard = bucket?.shift();
      if (nextCard) {
        selected.push(nextCard);
        addedCard = true;
      }
    });

    if (!addedCard) {
      break;
    }
  }

  return selected;
}

function toDateSeed(now: Date) {
  return now.toISOString().slice(0, 10);
}

function buildSmartMixedQueue(items: QueueCandidate[], deckOrder: string[], now: Date) {
  const remaining = [...items].sort(compareStudyPriority);
  const queue: QueueCandidate[] = [];
  let previousDeckId: string | undefined;
  const recentTags: string[] = [];
  let reviewStreak = 0;
  const random = seededRandom(`${toDateSeed(now)}:${deckOrder.join('|')}:smart-mix`);

  while (remaining.length > 0) {
    const nextIndex = pickNextCandidateIndex(remaining, previousDeckId, recentTags, reviewStreak, now, random);
    const [nextItem] = remaining.splice(nextIndex, 1);
    queue.push(nextItem);

    previousDeckId = nextItem.card.deckId;
    recentTags.push(...nextItem.card.tags);
    while (recentTags.length > 8) {
      recentTags.shift();
    }
    reviewStreak = nextItem.isNew ? 0 : reviewStreak + 1;
  }

  return queue;
}

function pickNextCandidateIndex(
  candidates: QueueCandidate[],
  previousDeckId: string | undefined,
  recentTags: string[],
  reviewStreak: number,
  now: Date,
  random: () => number,
) {
  const hasReviews = candidates.some((candidate) => !candidate.isNew);
  const shouldPreferReview = hasReviews && reviewStreak < 2;
  const scopedCandidates = shouldPreferReview ? candidates.filter((candidate) => !candidate.isNew) : candidates;
  const weightedCandidates = scopedCandidates.map((candidate) => ({
    candidate,
    weight: scoreCandidate(candidate, previousDeckId, recentTags, now),
  }));
  const totalWeight = weightedCandidates.reduce((total, item) => total + item.weight, 0);
  let cursor = random() * totalWeight;
  const picked = weightedCandidates.find((item) => {
    cursor -= item.weight;
    return cursor <= 0;
  }) ?? weightedCandidates[weightedCandidates.length - 1];

  return candidates.indexOf(picked.candidate);
}

function scoreCandidate(
  candidate: QueueCandidate,
  previousDeckId: string | undefined,
  recentTags: string[],
  now: Date,
) {
  let score = candidate.isNew ? 3 : 10;

  if (!candidate.isNew) {
    const dueAt = new Date(candidate.dueAt).getTime();
    const overdueDays = Math.max(0, (now.getTime() - dueAt) / (24 * 60 * 60 * 1000));
    score += overdueDays * 2;
    score += candidate.lapses * 3;
    if (candidate.intervalDays <= 1) {
      score += 2;
    }
  }

  if (previousDeckId && candidate.card.deckId === previousDeckId) {
    score *= 0.45;
  }

  if (candidate.card.tags.some((tag) => recentTags.includes(tag))) {
    score *= 0.75;
  }

  score += (hashString(`${candidate.card.id}:${toDateSeed(now)}`) % 1000) / 1000;

  return Math.max(0.1, score);
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
