import { Layers3 } from 'lucide-react';

import { SectionHeader } from '../components/SectionHeader';
import { Toggle } from '../components/Toggle';
import { deckLibrary } from '../decks/library';
import type { DatabaseSnapshot } from '../lib/db';
import { deckStats } from '../lib/stats';

type DecksScreenProps = {
  snapshot: DatabaseSnapshot;
  onToggleDeck: (deckId: string, enabled: boolean) => Promise<void>;
};

export function DecksScreen({ snapshot, onToggleDeck }: DecksScreenProps) {
  const stats = deckStats(
    snapshot.deckPrefs,
    snapshot.cardStates,
    snapshot.reviews,
    snapshot.settings.newCardsPerSession,
  );

  return (
    <main className="screen">
      <SectionHeader eyebrow="Library" title="Decks" />
      <div className="deck-list">
        {deckLibrary.map((deck) => {
          const deckStat = stats.find((item) => item.deckId === deck.id);
          const progress = deckStat ? Math.round((deckStat.reviewed / deckStat.total) * 100) : 0;

          return (
            <article className="deck-row" key={deck.id}>
              <div className="deck-row__top">
                <div className="deck-row__icon">
                  <Layers3 size={20} />
                </div>
                <div>
                  <h2>{deck.title}</h2>
                  <p>
                    {deck.level} · {deck.category} · {deck.notes.length} notes · {deckStat?.total ?? 0} cards
                  </p>
                </div>
                <Toggle
                  checked={Boolean(deckStat?.enabled)}
                  label={deckStat?.enabled ? 'On' : 'Off'}
                  onChange={(enabled) => void onToggleDeck(deck.id, enabled)}
                />
              </div>
              <p className="deck-row__description">{deck.description}</p>
              <div className="progress-line" aria-label={`${progress}% reviewed`}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <div className="deck-row__stats">
                <span>{deckStat?.due ?? 0} due</span>
                <span>{deckStat?.newCount ?? 0} new</span>
                <span>{deckStat?.retention ?? 0}% retention</span>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
