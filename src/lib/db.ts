import Dexie, { type Table } from 'dexie';

import { deckLibrary } from '../decks/library';
import type { StudyDirection } from '../decks/types';
import type { PracticeReview, PracticeState } from '../practice/types';
import type { CardStatus, Rating } from './scheduler';

export type ThemePreference = 'system' | 'light' | 'dark';
export type StudyInteractionMode = 'fixed-buttons' | 'swipe';

export type SettingsRecord = {
  id: 'settings';
  theme: ThemePreference;
  defaultDirection: StudyDirection;
  studyInteractionMode: StudyInteractionMode;
  dailyTarget: number;
  newCardsPerSession: number;
  voiceURI?: string;
};

export type DeckPreferenceRecord = {
  deckId: string;
  enabled: boolean;
  updatedAt: string;
};

export type CardStateRecord = {
  cardId: string;
  deckId: string;
  status: CardStatus;
  dueAt: string;
  intervalDays: number;
  ease: number;
  reps: number;
  lapses: number;
  lastReviewedAt?: string;
};

export type ReviewRecord = {
  id?: number;
  cardId: string;
  deckId: string;
  direction: Exclude<StudyDirection, 'mixed'>;
  rating: Rating;
  reviewedAt: string;
  responseMs: number;
  previousState: CardStateRecord;
  previousDueAt?: string;
  nextDueAt: string;
  intervalDays: number;
};

export type DatabaseSnapshot = {
  settings: SettingsRecord;
  deckPrefs: DeckPreferenceRecord[];
  cardStates: CardStateRecord[];
  reviews: ReviewRecord[];
};

export type LegacyBackupPayload = DatabaseSnapshot & {
  app: 'gracht.app';
  appVersion: '0.1.0';
  backupVersion: 1;
  dbSchemaVersion: 1;
  exportedAt: string;
};

export type PracticeBackupPayload = DatabaseSnapshot & {
  app: 'gracht.app';
  appVersion: string;
  backupVersion: 2;
  dbSchemaVersion: 2;
  exportedAt: string;
  practiceStates: PracticeState[];
  practiceReviews: PracticeReview[];
};

export type BackupPayload = LegacyBackupPayload | PracticeBackupPayload;

const defaultSettings: SettingsRecord = {
  id: 'settings',
  theme: 'system',
  defaultDirection: 'mixed',
  studyInteractionMode: 'fixed-buttons',
  dailyTarget: 30,
  newCardsPerSession: 10,
};

export class GrachtDatabase extends Dexie {
  settings!: Table<SettingsRecord, string>;
  deckPrefs!: Table<DeckPreferenceRecord, string>;
  cardStates!: Table<CardStateRecord, string>;
  reviews!: Table<ReviewRecord, number>;
  practiceStates!: Table<PracticeState, string>;
  practiceReviews!: Table<PracticeReview, number>;

  constructor(name = 'gracht-app') {
    super(name);

    this.version(1).stores({
      settings: 'id',
      deckPrefs: 'deckId, enabled',
      cardStates: 'cardId, deckId, dueAt, status',
      reviews: '++id, cardId, deckId, reviewedAt, rating',
    });

    // Keep all v1 tables and their records. New practice progress has its own keys.
    this.version(2).stores({
      settings: 'id',
      deckPrefs: 'deckId, enabled',
      cardStates: 'cardId, deckId, dueAt, status',
      reviews: '++id, cardId, deckId, reviewedAt, rating',
      practiceStates: 'itemId, status, dueAt',
      practiceReviews: '++id, itemId, reviewedAt, rating',
    });
  }
}

export const db = new GrachtDatabase();

export async function initializeDatabase() {
  const settings = await db.settings.get('settings');
  if (!settings) {
    await db.settings.put(defaultSettings);
  } else if (!settings.studyInteractionMode) {
    await db.settings.put({ ...defaultSettings, ...settings, studyInteractionMode: 'fixed-buttons' });
  }

  const existingPrefs = await db.deckPrefs.toArray();
  const existingIds = new Set(existingPrefs.map((pref) => pref.deckId));
  const missingPrefs = deckLibrary
    .filter((deck) => !existingIds.has(deck.id))
    .map((deck) => ({
      deckId: deck.id,
      enabled: deck.defaultEnabled,
      updatedAt: new Date().toISOString(),
    }));

  if (missingPrefs.length > 0) {
    await db.deckPrefs.bulkPut(missingPrefs);
  }
}

export async function loadDatabaseSnapshot(): Promise<DatabaseSnapshot> {
  await initializeDatabase();

  const [settings, deckPrefs, cardStates, reviews] = await Promise.all([
    db.settings.get('settings'),
    db.deckPrefs.toArray(),
    db.cardStates.toArray(),
    db.reviews.orderBy('reviewedAt').toArray(),
  ]);

  return {
    settings: { ...defaultSettings, ...settings },
    deckPrefs,
    cardStates,
    reviews,
  };
}

export async function saveSettings(nextSettings: SettingsRecord) {
  await db.settings.put(nextSettings);
}

export async function setDeckEnabled(deckId: string, enabled: boolean) {
  await db.deckPrefs.put({
    deckId,
    enabled,
    updatedAt: new Date().toISOString(),
  });
}

export async function recordReview(nextState: CardStateRecord, review: ReviewRecord) {
  await db.transaction('rw', db.cardStates, db.reviews, async () => {
    await db.cardStates.put(nextState);
    await db.reviews.add(review);
  });
}

export async function undoLastReview() {
  const lastReview = await db.reviews.orderBy('reviewedAt').last();
  if (!lastReview?.id) {
    return false;
  }

  await db.transaction('rw', db.cardStates, db.reviews, async () => {
    await db.reviews.delete(lastReview.id!);
    await db.cardStates.put(lastReview.previousState);
  });

  return true;
}

export async function exportBackup(): Promise<PracticeBackupPayload> {
  await initializeDatabase();
  return db.transaction('r', db.tables, async () => {
    const [settings, deckPrefs, cardStates, reviews, practiceStates, practiceReviews] = await Promise.all([
      db.settings.get('settings'),
      db.deckPrefs.toArray(),
      db.cardStates.toArray(),
      db.reviews.toArray(),
      db.practiceStates.toArray(),
      db.practiceReviews.toArray(),
    ]);
    return {
      app: 'gracht.app',
      appVersion: '0.2.0',
      backupVersion: 2,
      dbSchemaVersion: 2,
      exportedAt: new Date().toISOString(),
      settings: { ...defaultSettings, ...settings },
      deckPrefs,
      cardStates,
      reviews,
      practiceStates,
      practiceReviews,
    };
  });
}

type UnknownRecord = Record<string, unknown>;

function backupError(path: string, expected: string): never {
  throw new Error(`Backup ${path} must be ${expected}. No data was changed.`);
}

function object(value: unknown, path: string): UnknownRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return backupError(path, 'an object');
  }
  return value as UnknownRecord;
}

function text(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    backupError(path, 'a nonempty string');
  }
}

function number(value: unknown, path: string, minimum = 0, integer = false): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || (integer && !Number.isInteger(value))) {
    backupError(path, `${integer ? 'a whole number' : 'a finite number'} of at least ${minimum}`);
  }
}

function date(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) {
    backupError(path, 'a valid ISO date');
  }
  const [year, month, day, hour, minute, second] = value.slice(0, 19).split(/[-T:]/).map(Number);
  const calendarDate = new Date(0);
  calendarDate.setUTCFullYear(year, month - 1, day);
  calendarDate.setUTCHours(hour, minute, second, 0);
  if (calendarDate.getUTCFullYear() !== year || calendarDate.getUTCMonth() !== month - 1 || calendarDate.getUTCDate() !== day || calendarDate.getUTCHours() !== hour || calendarDate.getUTCMinutes() !== minute || calendarDate.getUTCSeconds() !== second) {
    backupError(path, 'a valid ISO date');
  }
}

function optionalDate(value: unknown, path: string) {
  if (value !== undefined) date(value, path);
}

function choice(value: unknown, options: string[], path: string) {
  if (typeof value !== 'string' || !options.includes(value)) {
    backupError(path, `one of ${options.join(', ')}`);
  }
}

function cardState(value: unknown, path: string) {
  const state = object(value, path);
  text(state.cardId, `${path}.cardId`);
  text(state.deckId, `${path}.deckId`);
  choice(state.status, ['new', 'learning', 'review'], `${path}.status`);
  date(state.dueAt, `${path}.dueAt`);
  number(state.intervalDays, `${path}.intervalDays`);
  number(state.ease, `${path}.ease`, Number.MIN_VALUE);
  number(state.reps, `${path}.reps`, 0, true);
  number(state.lapses, `${path}.lapses`, 0, true);
  optionalDate(state.lastReviewedAt, `${path}.lastReviewedAt`);
}

function practiceState(value: unknown, path: string) {
  const state = object(value, path);
  text(state.itemId, `${path}.itemId`);
  number(state.revision, `${path}.revision`, 1, true);
  choice(state.status, ['active', 'retired'], `${path}.status`);
  date(state.dueAt, `${path}.dueAt`);
  number(state.intervalDays, `${path}.intervalDays`, 0, true);
  number(state.reviews, `${path}.reviews`, 0, true);
  if (state.lastRating !== undefined) choice(state.lastRating, ['again', 'good', 'retire'], `${path}.lastRating`);
  optionalDate(state.lastReviewedAt, `${path}.lastReviewedAt`);
}

function records(value: unknown, path: string, validate: (record: unknown, path: string) => void, key: string) {
  if (!Array.isArray(value)) return backupError(path, 'an array');
  const ids = new Set<unknown>();
  value.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    validate(entry, entryPath);
    const id = (entry as UnknownRecord)[key];
    if (id !== undefined && ids.has(id)) backupError(`${entryPath}.${key}`, 'unique');
    ids.add(id);
  });
}

/** Validate the complete snapshot before opening a write transaction. */
export function validateBackup(value: unknown): BackupPayload {
  const payload = object(value, 'file');
  if (payload.app !== 'gracht.app' || !((payload.backupVersion === 1 && payload.dbSchemaVersion === 1) || (payload.backupVersion === 2 && payload.dbSchemaVersion === 2))) {
    throw new Error('This file is not a supported gracht.app backup. No data was changed.');
  }
  text(payload.appVersion, 'appVersion');
  date(payload.exportedAt, 'exportedAt');
  const settings = object(payload.settings, 'settings');
  if (settings.id !== 'settings') backupError('settings.id', 'settings');
  choice(settings.theme, ['system', 'light', 'dark'], 'settings.theme');
  choice(settings.defaultDirection, ['mixed', 'nl-en', 'en-nl'], 'settings.defaultDirection');
  if (settings.studyInteractionMode !== undefined) choice(settings.studyInteractionMode, ['fixed-buttons', 'swipe'], 'settings.studyInteractionMode');
  number(settings.dailyTarget, 'settings.dailyTarget', 1, true);
  number(settings.newCardsPerSession, 'settings.newCardsPerSession', 0, true);
  if (settings.voiceURI !== undefined) text(settings.voiceURI, 'settings.voiceURI');

  records(payload.deckPrefs, 'deckPrefs', (value, path) => {
    const pref = object(value, path);
    text(pref.deckId, `${path}.deckId`);
    if (typeof pref.enabled !== 'boolean') backupError(`${path}.enabled`, 'true or false');
    date(pref.updatedAt, `${path}.updatedAt`);
  }, 'deckId');
  records(payload.cardStates, 'cardStates', cardState, 'cardId');
  records(payload.reviews, 'reviews', (value, path) => {
    const review = object(value, path);
    if (review.id !== undefined) number(review.id, `${path}.id`, 1, true);
    text(review.cardId, `${path}.cardId`);
    text(review.deckId, `${path}.deckId`);
    choice(review.direction, ['nl-en', 'en-nl'], `${path}.direction`);
    choice(review.rating, ['again', 'hard', 'good', 'easy'], `${path}.rating`);
    date(review.reviewedAt, `${path}.reviewedAt`);
    number(review.responseMs, `${path}.responseMs`);
    cardState(review.previousState, `${path}.previousState`);
    const previous = review.previousState as UnknownRecord;
    if (previous.cardId !== review.cardId || previous.deckId !== review.deckId) backupError(`${path}.previousState`, 'for the same card and deck');
    optionalDate(review.previousDueAt, `${path}.previousDueAt`);
    date(review.nextDueAt, `${path}.nextDueAt`);
    number(review.intervalDays, `${path}.intervalDays`);
  }, 'id');

  if (payload.backupVersion === 2) {
    records(payload.practiceStates, 'practiceStates', practiceState, 'itemId');
    records(payload.practiceReviews, 'practiceReviews', (value, path) => {
      const review = object(value, path);
      if (review.id !== undefined) number(review.id, `${path}.id`, 1, true);
      text(review.itemId, `${path}.itemId`);
      number(review.revision, `${path}.revision`, 1, true);
      choice(review.rating, ['again', 'good', 'retire'], `${path}.rating`);
      date(review.reviewedAt, `${path}.reviewedAt`);
      if (review.previousState !== undefined) {
        practiceState(review.previousState, `${path}.previousState`);
        if ((review.previousState as UnknownRecord).itemId !== review.itemId) backupError(`${path}.previousState.itemId`, 'the reviewed item ID');
      }
      practiceState(review.nextState, `${path}.nextState`);
      const next = review.nextState as UnknownRecord;
      if (next.itemId !== review.itemId || next.revision !== review.revision || next.lastRating !== review.rating) backupError(`${path}.nextState`, 'consistent with the reviewed item, revision, and rating');
    }, 'id');
  }

  return {
    ...payload,
    settings: { ...defaultSettings, ...settings },
  } as BackupPayload;
}

export async function importBackup(value: unknown) {
  const payload = validateBackup(value);
  await db.transaction('rw', db.tables, async () => {
    await Promise.all([db.settings.clear(), db.deckPrefs.clear(), db.cardStates.clear(), db.reviews.clear()]);
    await db.settings.put(payload.settings);
    await db.deckPrefs.bulkPut(payload.deckPrefs);
    await db.cardStates.bulkPut(payload.cardStates);
    await db.reviews.bulkPut(payload.reviews);
    // A v1 backup predates practice data; importing it must not erase newer work.
    if (payload.backupVersion === 2) {
      await Promise.all([db.practiceStates.clear(), db.practiceReviews.clear()]);
      await db.practiceStates.bulkPut(payload.practiceStates);
      await db.practiceReviews.bulkPut(payload.practiceReviews);
    }
    await initializeDatabase();
  });
}
