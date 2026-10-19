import assert from 'node:assert/strict';
import process from 'node:process';

import { validateBackup } from '../src/lib/db';
import { lessons as realLessons, practiceItems } from '../src/practice/library';
import {
  buildPracticeQueue,
  buildScopedPracticeQueue,
  initialPracticeState,
  isPracticeDue,
  practiceDueDate,
  reconcilePracticeState,
  restorePracticeState,
  schedulePracticeReview,
} from '../src/practice/scheduler';
import { canUndoPracticeReview } from '../src/practice/storage';
import type { PracticeItem, PracticeKind, PracticeLesson, PracticeState } from '../src/practice/types';

process.env.TZ = 'Europe/Amsterdam';

function item(id: string, kind: PracticeKind = 'recall', lessonId = 'recent'): PracticeItem {
  return {
    id, kind, lessonId, topicIds: ['test-topic'], revision: 1, title: id, cue: 'Say it', prompt: 'I go home.',
    answer: 'Ik ga naar huis.', explanation: 'A phrase.', dutch: 'Ik ga naar huis.',
    english: 'I go home.', source: { label: 'Test lesson', quote: 'Ik ga naar huis.' },
  };
}

const lessons: PracticeLesson[] = [
  { id: 'older', title: 'Earlier lesson', date: '2026-05-01', sortOrder: 1, description: '' },
  { id: 'recent', title: 'Recent lesson', date: null, sortOrder: 2, description: '' },
];
const phrase = item('phrase');
const now = new Date(2026, 9, 24, 23, 55);

// A miss returns on the next local date, even when the attempt is near midnight.
const missed = schedulePracticeReview(phrase, undefined, 'again', now);
assert.equal(missed.dueAt, new Date(2026, 9, 25).toISOString());
assert.equal(missed.intervalDays, 1);
assert.equal(isPracticeDue(phrase, missed, new Date(2026, 9, 24, 23, 59)), false);
assert.equal(isPracticeDue(phrase, missed, new Date(2026, 9, 25)), true);

// The day that daylight saving ends is longer than 24 hours in Amsterdam.
const beforeClockChange = new Date(2026, 9, 25, 0, 30);
assert.equal(practiceDueDate(beforeClockChange, 1), new Date(2026, 9, 26).toISOString());
assert.equal(new Date(practiceDueDate(beforeClockChange, 1)).getTime() - beforeClockChange.getTime(), 24.5 * 60 * 60 * 1000);

let learned: PracticeState | undefined;
for (const days of [3, 7, 14, 30, 60, 60]) {
  learned = schedulePracticeReview(phrase, learned, 'good', now);
  assert.equal(learned.intervalDays, days);
  assert.equal(learned.dueAt, practiceDueDate(now, days));
}
const lapsed = schedulePracticeReview(phrase, learned, 'again', now);
assert.equal(schedulePracticeReview(phrase, lapsed, 'good', now).intervalDays, 3);

const retired = schedulePracticeReview(phrase, learned, 'retire', now);
assert.equal(retired.status, 'retired');
assert.equal(isPracticeDue(phrase, retired, new Date(2030, 0, 1)), false);
assert.deepEqual(buildPracticeQueue([phrase], [retired], lessons, new Date(2030, 0, 1)), []);
const restored = restorePracticeState(phrase, retired, now);
assert.equal(restored.status, 'active');
assert.equal(restored.reviews, retired.reviews);
assert.equal(restored.lastRating, undefined);
assert.equal(isPracticeDue(phrase, restored, now), true);
const retirementReview = { itemId: phrase.id, revision: phrase.revision, rating: 'retire' as const, reviewedAt: now.toISOString(), previousState: learned, nextState: retired };
assert.equal(canUndoPracticeReview(retired, retirementReview), true);
assert.equal(canUndoPracticeReview({ ...retired }, retirementReview), true);
assert.equal(canUndoPracticeReview(restored, retirementReview), false);
assert.equal(canUndoPracticeReview(undefined, retirementReview), false);
assert.equal(canUndoPracticeReview({ ...retired, dueAt: practiceDueDate(now, 20) }, retirementReview), false);
assert.equal(canUndoPracticeReview({ ...retired, revision: retired.revision + 1 }, retirementReview), false);

// Stable IDs keep their history, while a changed prompt gets another attempt.
const revisedPhrase = { ...phrase, revision: 2 };
const reconciled = reconcilePracticeState(revisedPhrase, retired, now);
assert.equal(reconciled.revision, 2);
assert.equal(reconciled.status, 'active');
assert.equal(reconciled.intervalDays, 0);
assert.equal(reconciled.reviews, retired.reviews);
assert.equal(reconciled.dueAt, now.toISOString());
assert.equal(retired.status, 'retired');
assert.equal(isPracticeDue(revisedPhrase, retired, now), true);
assert.equal(schedulePracticeReview(revisedPhrase, retired, 'good', now).intervalDays, 3);
assert.equal(reconcilePracticeState(phrase, reconciled, now).revision, 2);

const pool = [
  item('old-missed', 'recall', 'older'),
  item('new-recall-a'), item('new-recall-b'), item('new-contrast', 'contrast'),
  item('new-verb', 'verb'), item('old-build', 'build', 'older'),
  item('not-due'), item('retired'),
];
const queueStates = [
  schedulePracticeReview(pool[0], undefined, 'again', new Date(2026, 9, 23)),
  schedulePracticeReview(pool[6], undefined, 'good', now),
  schedulePracticeReview(pool[7], undefined, 'retire', now),
];
const queue = buildPracticeQueue(pool, queueStates, lessons, now);
assert.deepEqual(queue.map((entry) => entry.id), [
  'old-missed', 'new-contrast', 'new-recall-a', 'new-verb', 'old-build', 'new-recall-b',
]);
assert.deepEqual(buildPracticeQueue([...pool].reverse(), queueStates, lessons, now), queue);
assert.equal(buildPracticeQueue(pool, queueStates, lessons, now, 2).length, 2);
assert.equal(buildPracticeQueue(pool, queueStates, lessons, now, 0).length, 0);
assert.equal(buildPracticeQueue(Array.from({ length: 12 }, (_, index) => item(String(index))), [], lessons, now, 100).length, 8);
assert.equal(buildPracticeQueue([revisedPhrase], [retired], lessons, now)[0].revision, 2);
const realQueue = buildPracticeQueue(practiceItems, [], realLessons, now);
assert.equal(realQueue.length, 8);
assert.deepEqual([...new Set(realQueue.map((entry) => entry.kind))].sort(), ['build', 'contrast', 'recall', 'verb']);
const realLessonOrder = new Map(realLessons.map((lesson) => [lesson.id, lesson.sortOrder]));
for (const entry of realQueue.slice(0, 4)) {
  const newestForKind = Math.max(...practiceItems.filter((candidate) => candidate.kind === entry.kind)
    .map((candidate) => realLessonOrder.get(candidate.lessonId) ?? 0));
  assert.equal(realLessonOrder.get(entry.lessonId), newestForKind, `First ${entry.kind} should come from its newest lesson`);
}
const severalMisses = pool.slice(0, 3).map((entry) =>
  schedulePracticeReview(entry, undefined, 'again', new Date(2026, 9, 23)));
const missedQueue = buildPracticeQueue(pool, severalMisses, lessons, now);
assert.deepEqual(new Set(missedQueue.slice(0, 3).map((entry) => entry.id)), new Set(pool.slice(0, 3).map((entry) => entry.id)));

// The October refresh has no source date: its import order gives it priority.
const refreshedLessonId = 'notes-2026-10-19';
const refreshedLesson = realLessons.find((lesson) => lesson.id === refreshedLessonId);
const earlierUndatedLesson = realLessons.find((lesson) => lesson.id === 'latest-additions');
assert(refreshedLesson, 'Missing October lesson refresh');
assert(earlierUndatedLesson, 'Keep the earlier undated lesson ID stable');
assert.equal(refreshedLesson.date, null, 'The import date must not become a lesson date');
assert(refreshedLesson.sortOrder > earlierUndatedLesson.sortOrder, 'New source additions must outrank earlier undated notes');
const refreshedKinds = new Set(practiceItems.filter((entry) => entry.lessonId === refreshedLessonId).map((entry) => entry.kind));
assert.deepEqual([...refreshedKinds].sort(), ['build', 'contrast', 'recall', 'verb']);
// Limit this batch regression to its predecessors so later weekly imports can lead.
const atRefreshLessonIds = new Set(realLessons.filter((lesson) => lesson.sortOrder <= refreshedLesson.sortOrder).map((lesson) => lesson.id));
const atRefreshItems = practiceItems.filter((entry) => atRefreshLessonIds.has(entry.lessonId));
const refreshedQueue = buildPracticeQueue(atRefreshItems, [], realLessons, now);
for (const kind of refreshedKinds) {
  assert.equal(refreshedQueue.find((entry) => entry.kind === kind)?.lessonId, refreshedLessonId,
    `The newest ${kind} task should lead its kind`);
}
assert.deepEqual(buildPracticeQueue([...atRefreshItems].reverse(), [], [...realLessons].reverse(), now), refreshedQueue);

// An older failed answer remains ahead of new material, without suppressing variety.
const olderMisses = (['recall', 'build'] as const).map((kind) => {
  const olderItem = atRefreshItems.find((entry) => entry.lessonId !== refreshedLessonId && entry.kind === kind);
  assert(olderItem, `Missing older ${kind} task for priority regression`);
  return olderItem;
});
const refreshedWithMisses = buildPracticeQueue(atRefreshItems, olderMisses.map((entry) =>
  schedulePracticeReview(entry, undefined, 'again', new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))), realLessons, now);
assert.deepEqual(new Set(refreshedWithMisses.slice(0, olderMisses.length).map((entry) => entry.id)),
  new Set(olderMisses.map((entry) => entry.id)), 'All due misses should precede the newest lesson');
for (const kind of refreshedKinds) {
  assert.equal(refreshedWithMisses.slice(olderMisses.length).find((entry) => entry.kind === kind)?.lessonId,
    refreshedLessonId, `After due misses, the newest ${kind} task should lead its kind`);
}

// A selected lesson/topic includes future-due active exercises, never other items.
const future = schedulePracticeReview(pool[1], undefined, 'good', now);
const scope = { id: 'chosen-topic', title: 'Chosen topic', itemIds: [pool[1].id, pool[7].id, pool[5].id] };
const scoped = buildScopedPracticeQueue(pool, [future, queueStates[2]], lessons, scope, [], now);
assert.deepEqual(new Set(scoped.map((entry) => entry.id)), new Set([pool[1].id, pool[5].id]));
assert.equal(buildPracticeQueue([pool[1]], [future], lessons, now).length, 0);
assert.equal(buildScopedPracticeQueue(pool, [future], lessons, scope, [pool[1].id, pool[5].id, pool[7].id], now).length, 0);
assert.equal(buildScopedPracticeQueue([revisedPhrase], [retired], lessons, { ...scope, itemIds: [phrase.id] }, [], now)[0].revision, 2);

// Finite scoped batches keep variety and exclude everything already completed.
const kinds: PracticeKind[] = ['recall', 'contrast', 'build', 'verb'];
const scopeItems = Array.from({ length: 13 }, (_, index) => item(`scope-${index}`, kinds[index % kinds.length]));
const scopeStates = scopeItems.map((entry) => schedulePracticeReview(entry, undefined, 'good', now));
scopeStates[12] = schedulePracticeReview(scopeItems[12], scopeStates[12], 'retire', now);
const wholeScope = { id: 'lesson', title: 'This lesson', itemIds: scopeItems.map((entry) => entry.id) };
const firstBatch = buildScopedPracticeQueue(scopeItems, scopeStates, lessons, wholeScope, [], now);
assert.equal(firstBatch.length, 8);
assert.deepEqual([...new Set(firstBatch.map((entry) => entry.kind))].sort(), ['build', 'contrast', 'recall', 'verb']);
const firstIds = firstBatch.map((entry) => entry.id);
const secondBatch = buildScopedPracticeQueue(scopeItems, scopeStates, lessons, wholeScope, firstIds, now);
assert.equal(secondBatch.length, 4);
assert.equal(secondBatch.some((entry) => firstIds.includes(entry.id)), false);
assert.equal([...firstBatch, ...secondBatch].some((entry) => entry.id === scopeItems[12].id), false);
assert.equal(buildScopedPracticeQueue(scopeItems, scopeStates, lessons, wholeScope, [...firstIds, ...secondBatch.map((entry) => entry.id)], now).length, 0);

const legacyBackup = {
  app: 'gracht.app', appVersion: '0.1.0', backupVersion: 1, dbSchemaVersion: 1,
  exportedAt: now.toISOString(),
  settings: { id: 'settings', theme: 'system', defaultDirection: 'mixed', dailyTarget: 30, newCardsPerSession: 10 },
  deckPrefs: [], cardStates: [], reviews: [],
};
assert.equal(validateBackup(legacyBackup).settings.studyInteractionMode, 'fixed-buttons');
const currentBackup = {
  ...legacyBackup, backupVersion: 2, dbSchemaVersion: 2,
  practiceStates: [missed],
  practiceReviews: [{ itemId: phrase.id, revision: 1, rating: 'again', reviewedAt: now.toISOString(), nextState: missed }],
};
assert.equal(validateBackup(currentBackup).backupVersion, 2);
assert.throws(() => validateBackup(null), /No data was changed/);
assert.throws(() => validateBackup({ ...legacyBackup, settings: null }), /settings/);
assert.throws(() => validateBackup({ ...legacyBackup, reviews: null }), /reviews/);
assert.throws(() => validateBackup({ ...currentBackup, practiceReviews: undefined }), /practiceReviews/);
assert.throws(() => validateBackup({ ...currentBackup, practiceStates: [missed, missed] }), /unique/);
assert.throws(() => validateBackup({ ...currentBackup, practiceStates: [{ ...missed, intervalDays: Number.NaN }] }), /intervalDays/);
assert.throws(() => validateBackup({ ...currentBackup, practiceStates: [{ ...missed, status: 'lost' }] }), /status/);
assert.throws(() => validateBackup({ ...currentBackup, practiceStates: [{ ...missed, dueAt: '2026-99-99' }] }), /dueAt/);
assert.throws(() => validateBackup({ ...currentBackup, practiceStates: [{ ...missed, dueAt: '2026-02-31T00:00:00.000Z' }] }), /dueAt/);
assert.throws(() => validateBackup({ ...currentBackup, practiceReviews: [{ ...currentBackup.practiceReviews[0], itemId: 'another-item' }] }), /consistent/);

// Unseen is represented by the absence of a saved state; initialization is pure.
assert.equal(initialPracticeState(phrase, now).reviews, 0);
assert.equal(isPracticeDue(phrase, undefined, now), true);
console.log('Practice checks passed: calendar scheduling, intervals, retirement, stale-undo protection, revisions, queue order, and backup validation.');
