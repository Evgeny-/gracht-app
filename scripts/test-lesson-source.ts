import assert from 'node:assert/strict';
import { changedSpans, compareSource, DOCUMENT_ID, NORMALIZATION, parseSource, sourceHash, sourceTexts } from './lesson-source';

const source = (texts: string[], tabId = 't.0') => parseSource({ documentId: DOCUMENT_ID,
  paragraphs: texts.map((text) => ({ text, tabId })),
});
const old = source(['one', 'two', 'three']);
// Pinned before image tracking: old applied snapshots must retain their hash.
assert.equal(sourceHash(old), 'sha256:199604481fde2f42d30f7d50a1c84006f9a4fe69da60a77a4700b8a72bc63586');
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

const image = { id: 'image-1', tabId: 't.0', contentHash: `sha256:${'a'.repeat(64)}`,
  paragraphs: ['Het pak = the suit.'],
};
const withImages = (images: unknown) => parseSource({ ...old, images });
const illustrated = withImages([image]);
const imageCheckpoint = checkpoint(illustrated);
assert.notEqual(sourceHash(illustrated), sourceHash(old));
assert.equal(compareSource(withImages([{ ...image }]), imageCheckpoint, illustrated).status, 'unchanged');
assert.equal(sourceHash(withImages([{ ...image, paragraphs: ['Het pak = the suit.  '] }])), sourceHash(illustrated));
const secondImage = { ...image, id: 'image-2', paragraphs: undefined };
assert.equal(sourceHash(withImages([image, secondImage])), sourceHash(withImages([secondImage, image])));

// Replaced image bytes must be visible in the diff even when document text is identical.
const changedImage = { ...image, contentHash: `sha256:${'b'.repeat(64)}` };
const imageEdit = compareSource(withImages([changedImage]), imageCheckpoint, illustrated);
assert(imageEdit.status === 'changed');
assert.deepEqual(imageEdit.changes, []);
assert.deepEqual(imageEdit.imageChanges, { added: [], removed: [], changed: [{ previous: image, current: changedImage }] });
const imageAdded = compareSource(illustrated, appliedCheckpoint, old);
assert(imageAdded.status === 'changed');
assert.deepEqual(imageAdded.imageChanges.added, [image]);
const imageRemoved = compareSource(withImages([]), imageCheckpoint, illustrated);
assert(imageRemoved.status === 'changed');
assert.deepEqual(imageRemoved.imageChanges.removed, [image]);
assert.throws(() => compareSource(old, imageCheckpoint, illustrated), /omitted the image manifest.*full document/);
assert.throws(() => compareSource(source(['newer text']), imageCheckpoint, illustrated), /omitted the image manifest/);

// Quote validation can use exact reviewed image text without mixing it into text paragraphs.
assert(!old.paragraphs.some((paragraph) => paragraph.text.includes(image.paragraphs[0])));
assert(sourceTexts(illustrated).includes(image.paragraphs[0]));
assert.throws(() => withImages(null), /image entries/);
assert.throws(() => withImages([{ ...image, id: '' }]), /image entries/);
assert.throws(() => withImages([{ ...image, tabId: '' }]), /image entries/);
assert.throws(() => withImages([{ ...image, contentHash: 'image-url' }]), /image entries/);
assert.throws(() => withImages([{ ...image, paragraphs: [123] }]), /image entries/);
assert.throws(() => withImages([image, image]), /unique/);
console.log('Lesson source checks passed: text/image diffs, legacy hashes, source validation, applied-baseline recovery, failed-publication retries and confirmed no-ops.');
