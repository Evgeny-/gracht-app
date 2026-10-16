import assert from 'node:assert/strict';

import { verbGroups, verbItems, verbs } from '../src/verbs/library';
import { buildVerbQueue, FRESH_VERB_LIMIT, VERB_SESSION_LIMIT } from '../src/verbs/scheduler';
import type { PracticeItem, PracticeScope, PracticeState } from '../src/practice/types';

const now = new Date('2026-10-16T10:00:00.000Z');
const earlier = '2026-10-15T00:00:00.000Z';
const future = '2026-11-16T00:00:00.000Z';
const expectedTasks = ['meaning', 'recognize', 'past-singular', 'past-plural', 'perfect', 'sentence'];
const ids = (items: PracticeItem[]) => items.map((item) => item.id);
const wordBag = (text: string) => text.toLocaleLowerCase('nl').replace(/[.,!?;:]/g, '').split(/\s+/).filter(Boolean).sort().join('|');
const words = (text: string) => text.toLocaleLowerCase('nl').replace(/[().,!?;:…]/g, '').split(/\s+/).filter(Boolean);

function state(item: PracticeItem, overrides: Partial<PracticeState> = {}): PracticeState {
  return {
    itemId: item.id, revision: item.revision, status: 'active', dueAt: future,
    intervalDays: 3, reviews: 1, lastRating: 'good', lastReviewedAt: earlier,
    ...overrides,
  };
}

function task(verbId: string, kind: string): PracticeItem {
  const found = verbItems.find((item) => item.verbId === verbId && item.verbTask === kind);
  assert(found, `Missing ${verbId}/${kind}`);
  return found;
}

const checks: [string, () => void][] = [
  ['the catalogue has 24 complete verbs in four groups of six', () => {
    assert.equal(verbs.length, 24);
    assert.equal(new Set(verbs.map((verb) => verb.id)).size, 24);
    assert.equal(verbGroups.length, 4);
    for (const group of verbGroups) assert.equal(verbs.filter((verb) => verb.groupId === group.id).length, 6);
    assert.equal(verbItems.length, 144);
    assert.equal(new Set(ids(verbItems)).size, verbItems.length);
    for (const verb of verbs) {
      const items = verbItems.filter((item) => item.verbId === verb.id);
      assert.deepEqual(items.map((item) => item.verbTask).sort(), [...expectedTasks].sort());
      for (const item of items) {
        assert.equal(item.reference?.length, 4);
        assert(item.source.label.includes('Authored'));
        assert(!item.source.label.includes('teacher'));
      }
    }
  }],
  ['past and perfect questions contain real gaps and identify the target verb', () => {
    for (const verb of verbs) {
      for (const [kind, target] of [['past-singular', verb.past.singular], ['past-plural', verb.past.plural]]) {
        const item = task(verb.id, kind);
        assert.equal((item.prompt.match(/…/g) ?? []).length, 1, item.id);
        assert(!words(item.prompt).includes(target), `Answer leaks in ${item.id}`);
        assert(item.prompt.includes(`(${verb.infinitive})`));
      }
      const perfect = task(verb.id, 'perfect');
      assert.equal((perfect.prompt.match(/…/g) ?? []).length, 2, perfect.id);
      assert(!words(perfect.prompt).includes(verb.perfect.participle), perfect.id);
      assert(!words(perfect.prompt).includes(verb.perfect.auxiliary === 'zijn' ? 'ben' : 'heb'), perfect.id);
    }
  }],
  ['meaning directions and sentence builders have usable answers', () => {
    for (const verb of verbs) {
      const meaning = task(verb.id, 'meaning');
      assert.equal(meaning.prompt, meaning.title);
      assert.equal(meaning.promptLanguage, 'en');
      assert.equal(meaning.answerLanguage, 'nl');
      assert.equal(meaning.answer, verb.infinitive);
      const recognition = task(verb.id, 'recognize');
      assert.equal(recognition.prompt, verb.past.singular);
      assert.equal(recognition.promptLanguage, 'nl');
      assert.equal(recognition.answerLanguage, 'en');
      const sentence = task(verb.id, 'sentence');
      assert(sentence.tokens && sentence.acceptedAnswers?.includes(sentence.answer));
      for (const accepted of sentence.acceptedAnswers!) {
        assert.equal(wordBag(accepted), wordBag(sentence.tokens.join(' ')), sentence.id);
      }
    }
    assert.equal(task('weten', 'meaning').title, 'to know a fact');
    assert.match(task('lopen', 'perfect').answer, /^Ik heb /);
    assert(task('lopen', 'perfect').explanation.includes('Ik ben naar huis gelopen'));
    assert.equal(task('worden', 'perfect').answer, 'Ik ben moe geworden.');
  }],
  ['a fresh daily batch teaches three priority verbs through varied tasks', () => {
    const queue = buildVerbQueue([], undefined, [], now);
    assert.equal(queue.length, VERB_SESSION_LIMIT);
    assert.deepEqual([...new Set(queue.map((item) => item.verbId))].sort(), ['gaan', 'hebben', 'zijn']);
    assert.equal(queue[0].verbTask, 'past-singular');
    assert(queue.slice(0, 3).every((item) => item.kind === 'verb'));
    assert(new Set(queue.map((item) => item.verbTask)).size >= 4);
    for (let i = 1; i < queue.length; i++) assert.notEqual(queue[i].verbId, queue[i - 1].verbId);
  }],
  ['due reviews and missed answers precede fresh questions', () => {
    const missed = task('lopen', 'past-singular');
    const review = task('worden', 'perfect');
    const states = [state(review, { dueAt: earlier }), state(missed, { dueAt: earlier, lastRating: 'again' })];
    const queue = buildVerbQueue(states, undefined, [], now);
    assert.deepEqual(ids(queue.slice(0, 2)), [missed.id, review.id]);
    assert(!ids(buildVerbQueue([state(review)], undefined, [], now)).includes(review.id));
  }],
  ['started verbs occupy the fresh window before untouched verbs', () => {
    const started = task('lopen', 'meaning');
    const queue = buildVerbQueue([state(started)], undefined, [], now);
    const pendingVerbs = new Set(queue.filter((item) => item.id !== started.id).map((item) => item.verbId));
    assert(pendingVerbs.has('lopen'));
    assert(pendingVerbs.size <= FRESH_VERB_LIMIT);
    assert(!pendingVerbs.has('gaan'), 'Opening a fourth incomplete verb would exceed the window');
  }],
  ['completing all questions opens the next priority verbs', () => {
    const completed = verbItems.filter((item) => ['zijn', 'hebben', 'gaan'].includes(item.verbId!));
    const queue = buildVerbQueue(completed.map((item) => state(item)), undefined, ids(completed), now);
    assert.deepEqual([...new Set(queue.map((item) => item.verbId))].sort(), ['doen', 'komen', 'nemen']);
  }],
  ['retirement excludes tasks, while a newer revision returns', () => {
    const retired = verbItems.map((item) => state(item, { status: 'retired', lastRating: 'retire' }));
    assert.deepEqual(buildVerbQueue(retired, undefined, [], now), []);
    const changed = task('zijn', 'past-singular');
    const revisedStates = retired.map((entry) => entry.itemId === changed.id ? { ...entry, revision: changed.revision - 1 } : entry);
    assert.deepEqual(ids(buildVerbQueue(revisedStates, undefined, [], now)), [changed.id]);
  }],
  ['explicit scopes include active future tasks and stay inside their IDs', () => {
    const selected = verbItems.filter((item) => item.verbId === 'kopen');
    const scope: PracticeScope = { id: 'kopen', title: 'Kopen', itemIds: ids(selected) };
    const retired = selected[1];
    const completed = selected[2];
    const states = selected.map((item) => state(item, item.id === retired.id ? { status: 'retired' } : {}));
    const queue = buildVerbQueue(states, scope, [completed.id], now);
    assert.equal(queue.length, 4);
    assert(queue.every((item) => scope.itemIds.includes(item.id)));
    assert(!ids(queue).includes(retired.id));
    assert(!ids(queue).includes(completed.id));
    assert.equal(buildVerbQueue([], { id: 'all', title: 'All', itemIds: ids(verbItems) }, [], now).length, 8);
    assert.deepEqual(buildVerbQueue([], { id: 'unknown', title: 'Unknown', itemIds: ['missing'] }, [], now), []);
  }],
  ['daily batches progress through the catalogue without flooding or repeats', () => {
    const states: PracticeState[] = [];
    const completed: string[] = [];
    for (let batch = 0; batch < 30; batch++) {
      const queue = buildVerbQueue(states, undefined, completed, now);
      if (!queue.length) break;
      assert(queue.length <= VERB_SESSION_LIMIT);
      const fresh = queue.filter((item) => !states.some((entry) => entry.itemId === item.id));
      assert(new Set(fresh.map((item) => item.verbId)).size <= FRESH_VERB_LIMIT);
      for (const item of queue) {
        assert(!completed.includes(item.id), `Repeated ${item.id}`);
        completed.push(item.id);
        states.push(state(item));
      }
      const unfinished = verbs.filter((verb) => {
        const items = verbItems.filter((item) => item.verbId === verb.id);
        const seen = items.filter((item) => completed.includes(item.id)).length;
        return seen > 0 && seen < items.length;
      });
      assert(unfinished.length <= FRESH_VERB_LIMIT);
    }
    assert.equal(completed.length, verbItems.length);
    assert.deepEqual(buildVerbQueue(states, undefined, completed, now), []);
  }],
];

for (const [name, check] of checks) {
  check();
  console.log(`PASS ${name}`);
}
console.log(`${checks.length} verb content and scheduling checks passed.`);
