import { useCallback, useEffect, useRef, useState } from 'react';

import { practiceItems } from './library';
import {
  loadPracticeData,
  ratePracticeItem,
  restorePracticeItem,
  undoPracticeReview,
  type PracticeSnapshot,
} from './storage';
import type { PracticeItem, PracticeRating } from './types';

export function usePractice() {
  const [snapshot, setSnapshot] = useState<PracticeSnapshot>({ states: [], reviews: [] });
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const busyRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const next = await loadPracticeData(practiceItems);
      setSnapshot(next);
      setHasLoaded(true);
      setError(undefined);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not load your practice progress.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh().catch(() => {});
  }, [refresh]);

  const mutate = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    if (busyRef.current) throw new Error('Your previous practice action is still saving.');
    busyRef.current = true;
    setBusy(true);
    try {
      const result = await operation();
      await refresh();
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save your practice progress.');
      throw error;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [refresh]);

  const rate = useCallback((item: PracticeItem, rating: PracticeRating) =>
    mutate(() => ratePracticeItem(item, rating)), [mutate]);

  const undo = useCallback(() => mutate(async () => {
    const itemId = await undoPracticeReview();
    return practiceItems.find((item) => item.id === itemId);
  }), [mutate]);

  const restore = useCallback((item: PracticeItem) =>
    mutate(() => restorePracticeItem(item)), [mutate]);

  return { loading, hasLoaded, error, ...snapshot, refresh, rate, undo, restore, busy };
}
