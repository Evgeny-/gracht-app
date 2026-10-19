import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DOCUMENT_ID = '1wWqXpMZOCuDrDPBumpbZlD_yh81TdCStvmaoHaJQcPQ';
export const NORMALIZATION = 'nfc-whitespace-v1';
type Paragraph = { text: string; tabId?: string };
type Source = { documentId: string; paragraphs: Paragraph[] };
type Checkpoint = {
  schemaVersion: number;
  documentId: string;
  normalization: string;
  sourceHash: string;
  paragraphCount: number;
};

export function parseSource(value: unknown): Source {
  if (!value || typeof value !== 'object') throw new Error('Expected a Google Docs text response.');
  const response = value as Record<string, unknown>;
  const source = (response.structuredContent ?? response) as Partial<Source>;
  if (source.documentId !== DOCUMENT_ID) throw new Error('The source is not the configured teacher document.');
  if (!Array.isArray(source.paragraphs) || source.paragraphs.length === 0
    || source.paragraphs.some((p) => !p || typeof p.text !== 'string' || typeof p.tabId !== 'string')) {
    throw new Error('Expected nonempty paragraphs with text and tabId. Fetch all document tabs.');
  }
  return { documentId: source.documentId, paragraphs: source.paragraphs };
}

function paragraphKey(paragraph: Paragraph): string {
  return JSON.stringify([paragraph.tabId, paragraph.text.normalize('NFC').replace(/\s+/gu, ' ').trim()]);
}

export function sourceHash(source: Source): string {
  return `sha256:${createHash('sha256').update(JSON.stringify({
    documentId: source.documentId,
    normalization: NORMALIZATION,
    paragraphs: source.paragraphs.map(paragraphKey),
  })).digest('hex')}`;
}

/** Report every changed span, including edits in older lessons or other tabs. */
export function changedSpans(previous: Source, current: Source) {
  const a = previous.paragraphs.map(paragraphKey);
  const b = current.paragraphs.map(paragraphKey);
  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++;
  let aEnd = a.length, bEnd = b.length;
  while (aEnd > prefix && bEnd > prefix && a[aEnd - 1] === b[bEnd - 1]) { aEnd--; bEnd--; }
  if (prefix === aEnd && prefix === bEnd) return [];

  const describe = (from: number, to: number, nextFrom: number, nextTo: number) => ({
    previousRange: [from, to], currentRange: [nextFrom, nextTo],
    removed: previous.paragraphs.slice(from, to), added: current.paragraphs.slice(nextFrom, nextTo),
  });
  const n = aEnd - prefix, m = bEnd - prefix;
  // A large rewrite still needs review; report its whole span without quadratic memory.
  if ((n + 1) * (m + 1) > 4_000_000) return [describe(prefix, aEnd, prefix, bEnd)];
  const table = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    table[i][j] = a[prefix + i] === b[prefix + j]
      ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
  }
  const spans = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[prefix + i] === b[prefix + j]) { i++; j++; continue; }
    const from = i, nextFrom = j;
    while (i < n || j < m) {
      if (i < n && j < m && a[prefix + i] === b[prefix + j]) break;
      if (j < m && (i === n || table[i][j + 1] >= table[i + 1][j])) j++;
      else i++;
    }
    spans.push(describe(prefix + from, prefix + i, prefix + nextFrom, prefix + j));
  }
  return spans;
}

type SourceComparison = { sourceHash: string; paragraphCount: number } & (
  | { status: 'unchanged' }
  | { status: 'publication-unconfirmed'; appliedBaseline: 'missing' | 'mismatched'; action: string }
  | { status: 'baseline-missing'; action: string }
  | { status: 'changed'; previousParagraphCount: number; rangesAreZeroBasedAndEndExclusive: true; changes: ReturnType<typeof changedSpans> }
);

/** A committed checkpoint does not prove that its app build was published. */
export function compareSource(current: Source, checkpoint: Checkpoint, previous?: Source): SourceComparison {
  const hash = sourceHash(current);
  const summary = { sourceHash: hash, paragraphCount: current.paragraphs.length };
  const previousHash = previous ? sourceHash(previous) : undefined;

  if (hash === checkpoint.sourceHash) {
    if (current.paragraphs.length !== checkpoint.paragraphCount) {
      throw new Error('Repository checkpoint paragraph count is inconsistent. Reconcile the reviewed checkpoint before proceeding.');
    }
    if (previousHash !== checkpoint.sourceHash) {
      return {
        status: 'publication-unconfirmed', ...summary,
        appliedBaseline: previous ? 'mismatched' : 'missing',
        action: 'Reconcile the pushed commit SHA, its app deployment, the corresponding Pages deployment and the live build. After confirmed publication, run lesson:source checkpoint with this reviewed source.',
      };
    }
    return { status: 'unchanged', ...summary };
  }
  if (!previous) {
    return {
      status: 'baseline-missing', ...summary,
      action: 'Reconcile all current notes with the published exercises before advancing the checkpoint.',
    };
  }
  if (previousHash !== checkpoint.sourceHash) {
    throw new Error('Private baseline does not match the repository checkpoint. Reconcile publication and recover the reviewed snapshot before comparing.');
  }
  return {
    status: 'changed', ...summary,
    previousParagraphCount: previous.paragraphs.length,
    rangesAreZeroBasedAndEndExclusive: true,
    changes: changedSpans(previous, current),
  };
}

function main() {
  const [command, inputPath] = process.argv.slice(2);
  if (!['compare', 'checkpoint'].includes(command) || !inputPath) {
    throw new Error('Usage: npm run lesson:source -- compare|checkpoint /absolute/source.json');
  }
  const raw = JSON.parse(readFileSync(inputPath, 'utf8')) as unknown;
  const current = parseSource(raw);
  const hash = sourceHash(current);
  const checkpoint = JSON.parse(readFileSync(new URL('./teacher-sync.json', import.meta.url), 'utf8')) as Checkpoint;
  if (checkpoint.schemaVersion !== 1 || checkpoint.documentId !== DOCUMENT_ID || checkpoint.normalization !== NORMALIZATION) {
    throw new Error('Unsupported teacher-sync checkpoint; reconcile it before proceeding.');
  }
  const statePath = join(process.env.CODEX_HOME ?? join(homedir(), '.codex'), 'skills', 'gracht-lesson-update', 'state', 'teacher-source.json');

  if (command === 'checkpoint') {
    if (hash !== checkpoint.sourceHash || current.paragraphs.length !== checkpoint.paragraphCount) {
      throw new Error('Source differs from the reviewed repository checkpoint. No baseline was changed.');
    }
    mkdirSync(dirname(statePath), { recursive: true });
    const temporary = `${statePath}.${process.pid}.tmp`;
    writeFileSync(temporary, JSON.stringify(raw, null, 2) + '\n', { mode: 0o600 });
    renameSync(temporary, statePath);
    console.log(JSON.stringify({ status: 'checkpoint-saved', sourceHash: hash, statePath }));
    return;
  }

  let previous: Source | undefined;
  try { previous = parseSource(JSON.parse(readFileSync(statePath, 'utf8'))); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  console.log(JSON.stringify(compareSource(current, checkpoint, previous), null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
