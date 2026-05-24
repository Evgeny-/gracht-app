import Dexie, { type Table } from 'dexie';

import { deckLibrary } from '../decks/library';
import type { StudyDirection } from '../decks/types';
import type { CardStatus, Rating } from './scheduler';

export type ThemePreference = 'system' | 'light' | 'dark';

export type SettingsRecord = {
  id: 'settings';
  theme: ThemePreference;
  defaultDirection: StudyDirection;
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

export type BackupPayload = DatabaseSnapshot & {
  app: 'gracht.app';
  appVersion: '0.1.0';
  backupVersion: 1;
  dbSchemaVersion: 1;
  exportedAt: string;
};

const defaultSettings: SettingsRecord = {
  id: 'settings',
  theme: 'system',
  defaultDirection: 'mixed',
  dailyTarget: 30,
  newCardsPerSession: 10,
};

class GrachtDatabase extends Dexie {
  settings!: Table<SettingsRecord, string>;
  deckPrefs!: Table<DeckPreferenceRecord, string>;
  cardStates!: Table<CardStateRecord, string>;
  reviews!: Table<ReviewRecord, number>;

  constructor() {
    super('gracht-app');

    this.version(1).stores({
      settings: 'id',
      deckPrefs: 'deckId, enabled',
      cardStates: 'cardId, deckId, dueAt, status',
      reviews: '++id, cardId, deckId, reviewedAt, rating',
    });
  }
}

export const db = new GrachtDatabase();

export async function initializeDatabase() {
  const settings = await db.settings.get('settings');
  if (!settings) {
    await db.settings.put(defaultSettings);
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
    settings: settings ?? defaultSettings,
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

export async function exportBackup(): Promise<BackupPayload> {
  const snapshot = await loadDatabaseSnapshot();
  return {
    app: 'gracht.app',
    appVersion: '0.1.0',
    backupVersion: 1,
    dbSchemaVersion: 1,
    exportedAt: new Date().toISOString(),
    ...snapshot,
  };
}

export async function importBackup(payload: BackupPayload) {
  if (payload.app !== 'gracht.app' || payload.backupVersion !== 1 || payload.dbSchemaVersion !== 1) {
    throw new Error('This does not look like a gracht.app v1 backup.');
  }

  await db.transaction('rw', db.settings, db.deckPrefs, db.cardStates, db.reviews, async () => {
    await Promise.all([
      db.settings.clear(),
      db.deckPrefs.clear(),
      db.cardStates.clear(),
      db.reviews.clear(),
    ]);
    await db.settings.put(payload.settings);
    await db.deckPrefs.bulkPut(payload.deckPrefs);
    await db.cardStates.bulkPut(payload.cardStates);
    await db.reviews.bulkPut(payload.reviews);
  });

  await initializeDatabase();
}
