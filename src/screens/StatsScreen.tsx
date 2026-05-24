import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import type { DatabaseSnapshot } from '../lib/db';
import { dailyStats, deckStats, globalStats } from '../lib/stats';

type StatsScreenProps = {
  snapshot: DatabaseSnapshot;
};

export function StatsScreen({ snapshot }: StatsScreenProps) {
  const global = globalStats(
    snapshot.deckPrefs,
    snapshot.cardStates,
    snapshot.reviews,
    snapshot.settings.newCardsPerSession,
  );
  const daily = dailyStats(snapshot.reviews, 14);
  const decks = deckStats(
    snapshot.deckPrefs,
    snapshot.cardStates,
    snapshot.reviews,
    snapshot.settings.newCardsPerSession,
  );

  return (
    <main className="screen">
      <SectionHeader eyebrow="Progress" title="Stats" />

      <section className="stat-grid">
        <StatTile label="Total reviews" value={global.totalReviews} />
        <StatTile label="Retention" value={`${global.retention}%`} />
        <StatTile label="Learned" value={global.learned} />
        <StatTile label="Active cards" value={global.activeCards} />
      </section>

      <section className="chart-panel">
        <h2>Reviews per day</h2>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="reviews" fill="var(--chart-primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="chart-panel">
        <h2>Retention trend</h2>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} width={32} tickLine={false} axisLine={false} />
            <Tooltip />
            <Line
              dataKey="retention"
              type="monotone"
              stroke="var(--chart-secondary)"
              strokeWidth={3}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="panel">
        <div className="panel__title">
          <h2>Deck progress</h2>
        </div>
        <div className="deck-progress-list">
          {decks.map((deck) => (
            <div className="deck-progress" key={deck.deckId} data-muted={!deck.enabled}>
              <div>
                <strong>{deck.shortTitle}</strong>
                <span>
                  {deck.reviewed}/{deck.total} reviewed · {deck.due} due
                </span>
              </div>
              <div className="progress-line">
                <span style={{ width: `${Math.round((deck.reviewed / deck.total) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
