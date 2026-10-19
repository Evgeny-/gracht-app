import assert from 'node:assert/strict';
import { changedSpans, compareSource, DOCUMENT_ID, NORMALIZATION, parseSource, sourceHash } from './lesson-source';

const source = (texts: string[], tabId = 't.0') => parseSource({ documentId: DOCUMENT_ID,
  paragraphs: texts.map((text) => ({ text, tabId })),
});
const old = source(['one', 'two', 'three']);
const added = source(['one', 'inserted', 'two', 'three', 'tail']);
assert.deepEqual(changedSpans(old, added).map((span) => span.currentRange), [[1, 2], [4, 5]]);
assert.deepEqual(changedSpans(old, source(['one', 'changed'])).map((span) => span.removed.map((p) => p.text)), [['two', 'three']]);
assert.equal(sourceHash(source(['café\u000b  now '])), sourceHash(source(['cafe\u0301 now'])));
assert.deepEqual(changedSpans(source(['café\u000b now']), source(['cafe\u0301 now '])), []);
assert.notEqual(sourceHash(old), sourceHash(source(['one', 'two', 'three'], 'other-tab')));
assert(changedSpans(old, source(['two', 'one', 'three'])).length > 0);
assert.throws(() => parseSource({ documentId: 'another-document', paragraphs: old.paragraphs }), /configured teacher/);
assert.throws(() => parseSource({ documentId: DOCUMENT_ID, paragraphs: [] }), /nonempty/);
assert.throws(() => parseSource({ documentId: DOCUMENT_ID, paragraphs: [{ text: 'missing tab' }] }), /tabId/);

const checkpoint = (snapshot: ReturnType<typeof source>) => ({
  schemaVersion: 1, documentId: DOCUMENT_ID, normalization: NORMALIZATION,
  sourceHash: sourceHash(snapshot), paragraphCount: snapshot.paragraphs.length,
});
const appliedCheckpoint = checkpoint(old);
assert.equal(compareSource(old, appliedCheckpoint, old).status, 'unchanged');
assert.equal(compareSource(added, appliedCheckpoint, old).status, 'changed');

// A commit may update the public checkpoint before its Pages deployment fails.
// The next run sees the same source and must reconcile publication, not go quiet.
const committedCheckpoint = checkpoint(added);
const retry = compareSource(added, committedCheckpoint, old);
assert(retry.status === 'publication-unconfirmed');
assert.equal(retry.appliedBaseline, 'mismatched');
assert.match(retry.action, /commit SHA.*Pages.*live build/);
const missingAppliedBaseline = compareSource(added, committedCheckpoint);
assert(missingAppliedBaseline.status === 'publication-unconfirmed');
assert.equal(missingAppliedBaseline.appliedBaseline, 'missing');
// Publication and checkpointing restore a true no-op for identical content.
assert.equal(compareSource(added, committedCheckpoint, added).status, 'unchanged');
assert.equal(compareSource(source(['one', 'inserted', 'two', 'three', 'tail ']), committedCheckpoint, added).status, 'unchanged');
assert.equal(compareSource(added, appliedCheckpoint).status, 'baseline-missing');
assert.throws(() => compareSource(source(['newer source']), committedCheckpoint, old), /Reconcile publication/);
assert.throws(() => compareSource(old, { ...appliedCheckpoint, paragraphCount: 99 }, old), /paragraph count/);
console.log('Lesson source checks passed: source diffs, validation, applied-baseline recovery, failed-publication retries and confirmed no-ops.');
