import { useCallback, useEffect, useMemo, useState } from 'react';

import type { CardDirection } from '../decks/types';
import {
  type BackupPayload,
  type DatabaseSnapshot,
  exportBackup,
  importBackup,
  loadDatabaseSnapshot,
  recordReview,
  saveSettings,
  setDeckEnabled,
  undoLastReview,
  type SettingsRecord,
} from '../lib/db';
import { buildDeckPreferenceMap, buildStateMap, getActiveDeckIds } from '../lib/stats';
import { initialCardState, makeReviewRecord, type Rating, scheduleNextReview } from '../lib/scheduler';

type AppDataState = {
  loading: boolean;
  error?: string;
  snapshot?: DatabaseSnapshot;
};

export function useAppData() {
  const [state, setState] = useState<AppDataState>({ loading: true });

  const refresh = useCallback(async () => {
    try {
      const snapshot = await loadDatabaseSnapshot();
      setState({ loading: false, snapshot });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load local study data.',
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateSettings = useCallback(
    async (nextSettings: SettingsRecord) => {
      await saveSettings(nextSettings);
      await refresh();
    },
    [refresh],
  );

  const updateDeckEnabled = useCallback(
    async (deckId: string, enabled: boolean) => {
      await setDeckEnabled(deckId, enabled);
      await refresh();
    },
    [refresh],
  );

  const gradeCard = useCallback(
    async (
      cardId: string,
      deckId: string,
      direction: CardDirection,
      rating: Rating,
      responseMs: number,
    ) => {
      const previousState =
        state.snapshot?.cardStates.find((cardState) => cardState.cardId === cardId) ??
        initialCardState(cardId, deckId);
      const nextState = scheduleNextReview(previousState, rating);
      const review = makeReviewRecord(previousState, nextState, rating, direction, responseMs);

      await recordReview(nextState, review);
      await refresh();
    },
    [refresh, state.snapshot?.cardStates],
  );

  const downloadBackup = useCallback(async () => {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gracht-app-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, []);

  const restoreBackup = useCallback(
    async (file: File) => {
      const text = await file.text();
      const payload = JSON.parse(text) as BackupPayload;
      await importBackup(payload);
      await refresh();
    },
    [refresh],
  );

  const undoLastGrade = useCallback(async () => {
    await undoLastReview();
    await refresh();
  }, [refresh]);

  const derived = useMemo(() => {
    const snapshot = state.snapshot;
    if (!snapshot) {
      return {
        deckPreferenceMap: new Map<string, boolean>(),
        stateMap: new Map(),
        activeDeckIds: [] as string[],
      };
    }

    return {
      deckPreferenceMap: buildDeckPreferenceMap(snapshot.deckPrefs),
      stateMap: buildStateMap(snapshot.cardStates),
      activeDeckIds: getActiveDeckIds(snapshot.deckPrefs),
    };
  }, [state.snapshot]);

  return {
    ...state,
    ...derived,
    refresh,
    updateSettings,
    updateDeckEnabled,
    gradeCard,
    downloadBackup,
    restoreBackup,
    undoLastGrade,
  };
}
