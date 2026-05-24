export type StudyDirection = 'nl-en' | 'en-nl' | 'mixed';
export type CardDirection = Exclude<StudyDirection, 'mixed'>;
export type CardType = 'word' | 'phrase' | 'sentence' | 'grammar';

export type DeckExample = {
  nl: string;
  en: string;
};

export type DeckNote = {
  id: string;
  front: string;
  back: string;
  type: CardType;
  tags: string[];
  examples?: DeckExample[];
  notes?: string;
  acceptedAnswers?: string[];
  article?: 'de' | 'het';
  audio?: {
    nl?: string;
  };
  directions: CardDirection[];
};

export type GeneratedCard = DeckNote & {
  id: string;
  noteId: string;
  deckId: string;
  deckTitle: string;
  deckShortTitle: string;
  direction: CardDirection;
  prompt: string;
  answer: string;
  dutchText: string;
  englishText: string;
};

export type Deck = {
  id: string;
  title: string;
  shortTitle: string;
  level: 'A0' | 'A1' | 'A0-A1';
  category: string;
  description: string;
  source: string;
  version: number;
  defaultEnabled: boolean;
  notes: DeckNote[];
};
