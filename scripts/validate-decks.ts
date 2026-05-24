import { allCards, deckLibrary } from '../src/decks/library';

const validDirections = new Set(['nl-en', 'en-nl']);
const errors: string[] = [];
const deckIds = new Set<string>();
const noteIds = new Set<string>();
const generatedCardIds = new Set<string>();

for (const deck of deckLibrary) {
  if (deckIds.has(deck.id)) {
    errors.push(`Duplicate deck id: ${deck.id}`);
  }
  deckIds.add(deck.id);

  if (!deck.id || !deck.title || !deck.shortTitle || !deck.source || deck.version < 1) {
    errors.push(`Deck ${deck.id || '(missing id)'} has incomplete metadata.`);
  }

  if (!deck.notes.length) {
    errors.push(`Deck ${deck.id} has no notes.`);
  }

  for (const note of deck.notes) {
    if (noteIds.has(note.id)) {
      errors.push(`Duplicate note id: ${note.id}`);
    }
    noteIds.add(note.id);

    if (!note.id.startsWith(`${deck.id}:`)) {
      errors.push(`Note ${note.id} must be prefixed with its deck id.`);
    }

    if (!note.front.trim() || !note.back.trim()) {
      errors.push(`Note ${note.id} is missing Dutch or English text.`);
    }

    if (!note.directions.length) {
      errors.push(`Note ${note.id} has no generated directions.`);
    }

    for (const direction of note.directions) {
      if (!validDirections.has(direction)) {
        errors.push(`Note ${note.id} has unsupported direction ${direction}.`);
      }
    }

    if (note.tags.some((tag) => tag.trim() !== tag || tag.length === 0)) {
      errors.push(`Note ${note.id} has an invalid tag.`);
    }
  }
}

for (const card of allCards) {
  if (generatedCardIds.has(card.id)) {
    errors.push(`Duplicate generated card id: ${card.id}`);
  }
  generatedCardIds.add(card.id);
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(
  `Validated ${deckLibrary.length} decks, ${noteIds.size} notes, ${generatedCardIds.size} generated cards.`,
);
