import { BookOpen, Flame, Library, TrendingUp } from 'lucide-react';

import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import type { DatabaseSnapshot } from '../lib/db';
import type { TabId } from '../lib/navigation';
import { dailyStats, globalStats } from '../lib/stats';

type HomeScreenProps = {
  snapshot: DatabaseSnapshot;
  onNavigate: (tab: TabId) => void;
};

export function HomeScreen({ snapshot, onNavigate }: HomeScreenProps) {
  const stats = globalStats(
    snapshot.deckPrefs,
    snapshot.cardStates,
    snapshot.reviews,
    snapshot.settings.newCardsPerSession,
  );
  const lastWeek = dailyStats(snapshot.reviews, 7);
  const targetProgress = Math.min(100, Math.round((stats.reviewsToday / snapshot.settings.dailyTarget) * 100));

  return (
    <main className="screen">
      <SectionHeader
        eyebrow="gracht.app"
        title="Study Dutch today"
        action={
          <Button tone="primary" onClick={() => onNavigate('study')}>
            <BookOpen size={18} />
            Study
          </Button>
        }
      />

      <section className="hero-panel">
        <div>
          <p className="hero-panel__label">Due now</p>
          <strong>{stats.due}</strong>
          <span>{stats.activeDecks} active decks</span>
        </div>
        <div className="daily-ring" style={{ '--progress': `${targetProgress}%` } as React.CSSProperties}>
          <span>{stats.reviewsToday}</span>
          <small>/{snapshot.settings.dailyTarget}</small>
        </div>
      </section>

      <section className="stat-grid">
        <StatTile label="Streak" value={stats.streak} detail="review days" />
        <StatTile label="Learned" value={stats.learned} detail={`${stats.newCount} new left`} />
        <StatTile label="Retention" value={`${stats.retention}%`} detail="all reviews" />
        <StatTile label="Tomorrow" value={stats.dueByTomorrow} detail="due by end of day" />
      </section>

      <section className="panel">
        <div className="panel__title">
          <TrendingUp size={18} />
          <h2>Last 7 days</h2>
        </div>
        <div className="mini-bars" aria-label="Reviews in the last 7 days">
          {lastWeek.map((day) => (
            <div className="mini-bars__bar" key={day.date}>
              <span style={{ height: `${Math.max(8, Math.min(100, day.reviews * 14))}%` }} />
              <small>{day.date.slice(3)}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="quick-actions">
        <button type="button" onClick={() => onNavigate('decks')}>
          <Library size={19} />
          Manage decks
        </button>
        <button type="button" onClick={() => onNavigate('stats')}>
          <Flame size={19} />
          View stats
        </button>
      </section>
    </main>
  );
}
