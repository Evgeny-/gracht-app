import { isPracticeDue } from '../practice/scheduler';
import type { PracticeItem, PracticeScope, PracticeState } from '../practice/types';
import { verbItems, verbs } from './library';

export const VERB_SESSION_LIMIT = 8;
export const FRESH_VERB_LIMIT = 3;

const taskOrder = ['past-singular', 'past-plural', 'perfect', 'sentence', 'meaning', 'recognize'];
const verbPriority = new Map(verbs.map((verb) => [verb.id, verb.priority]));
const itemsByVerb = new Map(verbs.map((verb) => [verb.id, verbItems.filter((item) => item.verbId === verb.id)]));

function active(item: PracticeItem, state: PracticeState | undefined): boolean {
  return !state || state.status !== 'retired' || item.revision > state.revision;
}

function attempted(state: PracticeState | undefined): boolean {
  return (state?.reviews ?? 0) > 0;
}

/**
 * Finish the unreviewed questions of started verbs before opening another verb.
 * Completed IDs also count as attempts, so an ongoing session can move forward
 * even when its caller has not yet supplied a refreshed state snapshot.
 */
function freshVerbWindow(
  stateMap: Map<string, PracticeState>,
  completed: Set<string>,
): Set<string> {
  const incomplete = verbs
    .filter((verb) => itemsByVerb.get(verb.id)!.some((item) =>
      !completed.has(item.id) && active(item, stateMap.get(item.id)) && !attempted(stateMap.get(item.id)),
    ))
    .map((verb) => ({
      verb,
      started: itemsByVerb.get(verb.id)!.some((item) => attempted(stateMap.get(item.id)) || completed.has(item.id)),
    }))
    .sort((a, b) => Number(b.started) - Number(a.started) || a.verb.priority - b.verb.priority);
  return new Set(incomplete.slice(0, FRESH_VERB_LIMIT).map(({ verb }) => verb.id));
}

type Candidate = { item: PracticeItem; priority: number; dueAt: number };

/**
 * Daily practice reviews due answers first and opens at most three incomplete
 * verbs. An explicit scope can revisit its active future answers as well.
 * Keep the returned batch fixed while grading it, then request the next batch
 * with completedIds to avoid repeats during the same practice session.
 */
export function buildVerbQueue(
  states: PracticeState[],
  scope?: PracticeScope,
  completedIds: string[] = [],
  now = new Date(),
): PracticeItem[] {
  const stateMap = new Map(states.map((state) => [state.itemId, state]));
  const completed = new Set(completedIds);
  const selected = scope ? new Set(scope.itemIds) : undefined;
  const freshVerbs = freshVerbWindow(stateMap, completed);

  const candidates: Candidate[] = verbItems.flatMap((item) => {
    const state = stateMap.get(item.id);
    if (completed.has(item.id) || !active(item, state)) return [];
    const due = isPracticeDue(item, state, now);
    if (selected ? !selected.has(item.id) : !due || (!attempted(state) && !freshVerbs.has(item.verbId!))) return [];
    const missed = due && state?.lastRating === 'again' && state.revision >= item.revision;
    return [{
      item,
      priority: missed ? 0 : attempted(state) ? 1 : 2,
      dueAt: state ? new Date(state.dueAt).getTime() : now.getTime(),
    }];
  }).sort((a, b) => a.priority - b.priority
    || a.dueAt - b.dueAt
    || verbPriority.get(a.item.verbId!)! - verbPriority.get(b.item.verbId!)!
    || taskOrder.indexOf(a.item.verbTask!) - taskOrder.indexOf(b.item.verbTask!)
    || a.item.id.localeCompare(b.item.id));

  const queue: PracticeItem[] = [];
  const verbCounts = new Map<string, number>();
  const taskCounts = new Map<string, number>();
  while (candidates.length && queue.length < VERB_SESSION_LIMIT) {
    const priority = candidates[0].priority;
    let pool = candidates.filter((candidate) => candidate.priority === priority);
    const previousVerb = queue.at(-1)?.verbId;
    if (pool.some((candidate) => candidate.item.verbId !== previousVerb)) {
      pool = pool.filter((candidate) => candidate.item.verbId !== previousVerb);
    }
    const leastSeenVerb = Math.min(...pool.map(({ item }) => verbCounts.get(item.verbId!) ?? 0));
    pool = pool.filter(({ item }) => (verbCounts.get(item.verbId!) ?? 0) === leastSeenVerb);
    const leastSeenTask = Math.min(...pool.map(({ item }) => taskCounts.get(item.verbTask!) ?? 0));
    pool = pool.filter(({ item }) => (taskCounts.get(item.verbTask!) ?? 0) === leastSeenTask);
    // The original order breaks ties by due date, verb priority, then useful form tasks.
    const next = pool[0];
    candidates.splice(candidates.indexOf(next), 1);
    queue.push(next.item);
    verbCounts.set(next.item.verbId!, (verbCounts.get(next.item.verbId!) ?? 0) + 1);
    taskCounts.set(next.item.verbTask!, (taskCounts.get(next.item.verbTask!) ?? 0) + 1);
  }
  return queue;
}
