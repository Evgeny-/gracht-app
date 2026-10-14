export type PracticeKind = 'recall' | 'contrast' | 'build' | 'verb';
export type PracticeRating = 'again' | 'good' | 'retire';

export type PracticeTopic = { id: string; title: string };
export type PracticeScope = { id: string; title: string; itemIds: string[] };

export type PracticeLesson = {
  id: string;
  title: string;
  date: string | null;
  sortOrder: number;
  description: string;
};

export type PracticeItem = {
  id: string;
  revision: number;
  lessonId: string;
  topicIds: string[];
  kind: PracticeKind;
  title: string;
  cue: string;
  prompt: string;
  answer: string;
  explanation: string;
  dutch: string;
  english: string;
  source: {
    label: string;
    quote: string;
    adapted?: boolean;
  };
  tokens?: string[];
  acceptedAnswers?: string[];
  reference?: { label: string; dutch: string }[];
};

export type PracticeState = {
  itemId: string;
  revision: number;
  status: 'active' | 'retired';
  dueAt: string;
  intervalDays: number;
  reviews: number;
  lastRating?: PracticeRating;
  lastReviewedAt?: string;
};

export type PracticeReview = {
  id?: number;
  itemId: string;
  revision: number;
  rating: PracticeRating;
  reviewedAt: string;
  previousState?: PracticeState;
  nextState: PracticeState;
};
