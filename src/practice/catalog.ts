import { verbItems } from '../verbs/library';
import { practiceItems } from './library';
import type { PracticeItem } from './types';

// Persist every exercise through one registry, while each section owns its queue.
export const allPracticeItems: PracticeItem[] = [...practiceItems, ...verbItems];
