import type {
  PracticeItem,
  PracticeLesson,
  PracticeRating,
  PracticeScope,
  PracticeState,
} from './types';

export const PRACTICE_SESSION_LIMIT = 8;
const goodIntervals = [3, 7, 14, 30, 60] as const;

/** Calendar days, rather than elapsed 24-hour periods, also work across DST. */
export function practiceDueDate(now: Date, days: number): string {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + days).toISOString();
}

export function initialPracticeState(item: PracticeItem, now = new Date()): PracticeState {
  return {
    itemId: item.id,
    revision: item.revision,
    status: 'active',
    dueAt: now.toISOString(),
    intervalDays: 0,
    reviews: 0,
  };
}

/** A changed prompt needs another attempt, including a previously retired prompt. */
export function reconcilePracticeState(
  item: PracticeItem,
  previousState: PracticeState,
  now = new Date(),
): PracticeState {
  if (item.revision <= previousState.revision) {
    return { ...previousState };
  }

  const { lastRating: _lastRating, ...previous } = previousState;
  return {
    ...previous,
    revision: item.revision,
    status: 'active',
    dueAt: now.toISOString(),
    intervalDays: 0,
  };
}

export function schedulePracticeReview(
  item: PracticeItem,
  previousState: PracticeState | undefined,
  rating: PracticeRating,
  now = new Date(),
): PracticeState {
  const state = previousState
    ? reconcilePracticeState(item, previousState, now)
    : initialPracticeState(item, now);

  const intervalDays = rating === 'again'
    ? 1
    : rating === 'good'
      ? goodIntervals.find((days) => days > state.intervalDays) ?? 60
      : state.intervalDays;

  return {
    ...state,
    status: rating === 'retire' ? 'retired' : 'active',
    // Retirement has no scheduled return. Its status excludes it from every queue.
    dueAt: rating === 'retire' ? state.dueAt : practiceDueDate(now, intervalDays),
    intervalDays,
    reviews: state.reviews + 1,
    lastRating: rating,
    lastReviewedAt: now.toISOString(),
  };
}

export function restorePracticeState(
  item: PracticeItem,
  previousState: PracticeState | undefined,
  now = new Date(),
): PracticeState {
  const previous = previousState ?? initialPracticeState(item, now);
  const { lastRating: _lastRating, ...state } = previous;
  return {
    ...state,
    revision: Math.max(item.revision, state.revision),
    status: 'active',
    dueAt: now.toISOString(),
    intervalDays: 0,
  };
}

export function isPracticeDue(
  item: PracticeItem,
  state: PracticeState | undefined,
  now = new Date(),
): boolean {
  if (!state || item.revision > state.revision) {
    return true;
  }
  return state.status === 'active' && new Date(state.dueAt).getTime() <= now.getTime();
}

/**
 * The caller keeps this queue for the whole session. Rebuilding it after each grade
 * would keep introducing unseen items and make an eight-item session endless.
 */
export function buildPracticeQueue(
  items: PracticeItem[],
  states: PracticeState[],
  lessons: PracticeLesson[],
  now = new Date(),
  limit = PRACTICE_SESSION_LIMIT,
): PracticeItem[] {
  const stateMap = new Map(states.map((state) => [state.itemId, state]));
  return orderPracticeQueue(
    items.filter((item) => isPracticeDue(item, stateMap.get(item.id), now)),
    stateMap, lessons, now, limit,
  );
}

/** Explicit lesson/topic practice can revisit future items without repeating a batch. */
export function buildScopedPracticeQueue(
  items: PracticeItem[],
  states: PracticeState[],
  lessons: PracticeLesson[],
  scope: PracticeScope,
  completedIds: string[] = [],
  now = new Date(),
  limit = PRACTICE_SESSION_LIMIT,
): PracticeItem[] {
  const selected = new Set(scope.itemIds);
  const completed = new Set(completedIds);
  const stateMap = new Map(states.map((state) => [state.itemId, state]));
  return orderPracticeQueue(
    items.filter((item) => {
      const state = stateMap.get(item.id);
      return selected.has(item.id) && !completed.has(item.id)
        && (!state || state.status !== 'retired' || item.revision > state.revision);
    }),
    stateMap, lessons, now, limit,
  );
}

function orderPracticeQueue(
  items: PracticeItem[],
  stateMap: Map<string, PracticeState>,
  lessons: PracticeLesson[],
  now: Date,
  limit: number,
): PracticeItem[] {
  const count = Math.min(PRACTICE_SESSION_LIMIT, Math.max(0, Math.floor(limit)));
  const lessonOrder = new Map(lessons.map((lesson) => [lesson.id, lesson.sortOrder]));
  const candidates = items
    .map((item) => {
      const state = stateMap.get(item.id);
      return {
        item,
        missed: state?.lastRating === 'again' && item.revision <= state.revision && isPracticeDue(item, state, now),
        lessonOrder: lessonOrder.get(item.lessonId) ?? 0,
        dueAt: state?.dueAt ?? now.toISOString(),
      };
    })
    .sort((a, b) =>
      Number(b.missed) - Number(a.missed)
      || b.lessonOrder - a.lessonOrder
      || new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      || (a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0),
    );

  const queue: PracticeItem[] = [];
  let previousPriority: boolean | undefined;
  const kindCounts = new Map<PracticeItem['kind'], number>();
  while (candidates.length > 0 && queue.length < count) {
    // Missed items all precede the rest. Within each group, give every available
    // kind a turn before taking another item of the same kind. Recency still
    // chooses which item from that kind to introduce.
    const priority = candidates[0].missed;
    if (priority !== previousPriority) kindCounts.clear();
    previousPriority = priority;
    const leastSeen = Math.min(...candidates
      .filter((candidate) => candidate.missed === priority)
      .map((candidate) => kindCounts.get(candidate.item.kind) ?? 0));
    const index = candidates.findIndex((candidate) =>
      candidate.missed === priority && (kindCounts.get(candidate.item.kind) ?? 0) === leastSeen,
    );
    const [candidate] = candidates.splice(index, 1);
    queue.push(candidate.item);
    kindCounts.set(candidate.item.kind, (kindCounts.get(candidate.item.kind) ?? 0) + 1);
  }
  return queue;
}
