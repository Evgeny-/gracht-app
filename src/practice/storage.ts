import { db, initializeDatabase } from '../lib/db';
import {
  reconcilePracticeState,
  restorePracticeState,
  schedulePracticeReview,
} from './scheduler';
import type { PracticeItem, PracticeRating, PracticeReview, PracticeState } from './types';

export type PracticeSnapshot = {
  states: PracticeState[];
  reviews: PracticeReview[];
};

export async function loadPracticeData(items: PracticeItem[], now = new Date()): Promise<PracticeSnapshot> {
  await initializeDatabase();
  return db.transaction('rw', db.practiceStates, db.practiceReviews, async () => {
    const states = await db.practiceStates.toArray();
    const itemMap = new Map(items.map((item) => [item.id, item]));
    const updated = states
      .filter((state) => (itemMap.get(state.itemId)?.revision ?? 0) > state.revision)
      .map((state) => reconcilePracticeState(itemMap.get(state.itemId)!, state, now));
    if (updated.length > 0) await db.practiceStates.bulkPut(updated);
    const updatedMap = new Map(updated.map((state) => [state.itemId, state]));
    return {
      states: states.map((state) => updatedMap.get(state.itemId) ?? state),
      reviews: await db.practiceReviews.toArray(),
    };
  });
}

export async function ratePracticeItem(
  item: PracticeItem,
  rating: PracticeRating,
  now = new Date(),
): Promise<void> {
  await db.transaction('rw', db.practiceStates, db.practiceReviews, async () => {
    // Read inside the transaction rather than relying on a stale React snapshot.
    const previousState = await db.practiceStates.get(item.id);
    const nextState = schedulePracticeReview(item, previousState, rating, now);
    const review: PracticeReview = {
      itemId: item.id,
      revision: nextState.revision,
      rating,
      reviewedAt: now.toISOString(),
      previousState,
      nextState,
    };
    await db.practiceStates.put(nextState);
    await db.practiceReviews.add(review);
  });
}

export function canUndoPracticeReview(state: PracticeState | undefined, review: PracticeReview): boolean {
  const expected = review.nextState;
  return state !== undefined
    && state.itemId === expected.itemId
    && state.revision === expected.revision
    && state.status === expected.status
    && state.dueAt === expected.dueAt
    && state.intervalDays === expected.intervalDays
    && state.reviews === expected.reviews
    && state.lastRating === expected.lastRating
    && state.lastReviewedAt === expected.lastReviewedAt;
}

/** Returns the item ID so the UI can put the undone item back into its session. */
export async function undoPracticeReview(expectedItemId?: string): Promise<string | undefined> {
  return db.transaction('rw', db.practiceStates, db.practiceReviews, async () => {
    const review = await db.practiceReviews.orderBy('id').last();
    if (!review || review.id === undefined) return undefined;
    if (expectedItemId !== undefined && review.itemId !== expectedItemId) {
      throw new Error('Your latest answer belongs to another practice session. Return there to undo it.');
    }
    const currentState = await db.practiceStates.get(review.itemId);
    if (!canUndoPracticeReview(currentState, review)) {
      throw new Error('That answer can’t be undone because its progress has since changed. Your current schedule was kept.');
    }
    if (review.previousState) {
      await db.practiceStates.put(review.previousState);
    } else {
      await db.practiceStates.delete(review.itemId);
    }
    await db.practiceReviews.delete(review.id);
    return review.itemId;
  });
}

export async function restorePracticeItem(item: PracticeItem, now = new Date()): Promise<void> {
  await db.transaction('rw', db.practiceStates, async () => {
    const previousState = await db.practiceStates.get(item.id);
    await db.practiceStates.put(restorePracticeState(item, previousState, now));
  });
}
