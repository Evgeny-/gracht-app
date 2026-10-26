import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { DOCUMENT_URL, lessons, practiceItems, topics } from '../src/practice/library';
import { parseSource, sourceTexts } from './lesson-source';

const lessonIds = new Set(lessons.map((lesson) => lesson.id));
const itemIds = new Set<string>();
const topicIds = new Set(topics.map((topic) => topic.id));
const kinds = new Map<string, number>();
const wordBag = (text: string) =>
  text
    .toLocaleLowerCase('nl')
    .replace(/[‘’]/g, "'")
    .replace(/[.,!?;:]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join('|');

assert.equal(lessonIds.size, lessons.length, 'Duplicate lesson ID');
assert.equal(topicIds.size, topics.length, 'Duplicate topic ID');
assert.match(DOCUMENT_URL, /^https:\/\/docs\.google\.com\/document\/d\//);

for (const entry of practiceItems) {
  assert(!itemIds.has(entry.id), `Duplicate item ID: ${entry.id}`);
  itemIds.add(entry.id);
  assert(lessonIds.has(entry.lessonId), `Unknown lesson: ${entry.id}`);
  assert(entry.topicIds.length > 0, `Missing topic: ${entry.id}`);
  assert.equal(new Set(entry.topicIds).size, entry.topicIds.length, `Duplicate topic tag: ${entry.id}`);
  for (const topicId of entry.topicIds) assert(topicIds.has(topicId), `Unknown topic ${topicId}: ${entry.id}`);
  assert(Number.isSafeInteger(entry.revision) && entry.revision >= 1, `Invalid revision: ${entry.id}`);
  for (const field of ['title', 'cue', 'prompt', 'answer', 'explanation', 'dutch', 'english'] as const) {
    assert(entry[field].trim(), `Missing ${field}: ${entry.id}`);
  }
  assert(entry.source.label && entry.source.quote, `Missing source: ${entry.id}`);
  kinds.set(entry.kind, (kinds.get(entry.kind) ?? 0) + 1);

  if (entry.kind === 'build') {
    assert(entry.tokens && entry.tokens.length > 1, `Missing tokens: ${entry.id}`);
    assert(entry.acceptedAnswers, `Missing accepted answers: ${entry.id}`);
    assert(entry.acceptedAnswers.includes(entry.answer), `Model answer is not accepted: ${entry.id}`);
    for (const accepted of entry.acceptedAnswers) {
      assert.equal(wordBag(accepted), wordBag(entry.tokens.join(' ')), `Unbuildable answer: ${entry.id}: ${accepted}`);
    }
  }
  if (entry.kind === 'verb') {
    assert.equal(entry.reference?.length, 3, `Missing verb reference: ${entry.id}`);
    assert(entry.source.adapted, `Transformation must be labelled as adapted: ${entry.id}`);
  }
}

assert.deepEqual([...kinds.keys()].sort(), ['build', 'contrast', 'recall', 'verb']);
for (const lesson of lessons) assert(practiceItems.some((item) => item.lessonId === lesson.id), `Lesson has no exercises: ${lesson.id}`);
for (const topic of topics) assert(practiceItems.some((item) => item.topicIds.includes(topic.id)), `Topic has no exercises: ${topic.id}`);

// Pass the private source extract to verify quotes without adding lesson notes to the repository.
if (process.argv[2]) {
  const source = parseSource(JSON.parse(readFileSync(process.argv[2], 'utf8')));
  const passages = sourceTexts(source);
  for (const entry of practiceItems) {
    assert(
      passages.some((passage) => passage.includes(entry.source.quote)),
      `Source quotation is not exact: ${entry.id}: ${entry.source.quote}`,
    );
  }
}

console.log(`${practiceItems.length} practice items in ${lessons.length} lesson groups and ${topics.length} topics: ${[...kinds].map(([kind, count]) => `${count} ${kind}`).join(', ')}.`);
console.log(process.argv[2] ? 'All source quotations match the teacher document.' : 'Source quotations were not checked; pass the source JSON path to verify them.');
