import { ArrowLeft, ArrowRight, BookOpen, Check, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '../components/Button';
import { lessons, practiceItems } from './library';
import { PracticeCard } from './PracticeCard';
import { buildPracticeQueue, buildScopedPracticeQueue } from './scheduler';
import type { PracticeItem, PracticeRating, PracticeScope, PracticeState } from './types';

type Props = {
  states: PracticeState[];
  busy: boolean;
  voiceURI?: string;
  onRate: (item: PracticeItem, rating: PracticeRating) => Promise<void>;
  onUndo: () => Promise<PracticeItem | undefined>;
  onMaterial: () => void;
  onDaily: () => void;
  scope?: PracticeScope;
};

function localDay(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function PracticeScreen({ states, busy, voiceURI, onRate, onUndo, onMaterial, onDaily, scope }: Props) {
  const [session, setSession] = useState(() => ({ queue: scope ? buildScopedPracticeQueue(practiceItems, states, lessons, scope) : buildPracticeQueue(practiceItems, states, lessons), index: 0, ratings: [] as PracticeRating[], day: localDay(), scope, completedIds: [] as string[] }));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);
  const latestStates = useRef(states);
  latestStates.current = states;
  const sessionDay = useRef(session.day);
  const item = session.queue[session.index];
  const remaining = session.scope
    ? buildScopedPracticeQueue(practiceItems, states, lessons, session.scope, session.completedIds)
    : buildPracticeQueue(practiceItems, states, lessons);
  const completed = session.index;

  useEffect(() => {
    let timer: number;
    function resume() {
      window.clearTimeout(timer);
      const now = new Date();
      const day = localDay(now);
      if (day !== sessionDay.current) {
        // Finish an in-flight save before replacing the session it belongs to.
        if (lock.current) {
          timer = window.setTimeout(resume, 250);
          return;
        }
        sessionDay.current = day;
        setSession({ queue: buildPracticeQueue(practiceItems, latestStates.current, lessons, now), index: 0, ratings: [], day, scope: undefined, completedIds: [] });
        setMessage('');
        setError('');
      }
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = window.setTimeout(resume, midnight.getTime() - now.getTime() + 25);
    }
    function visibilityChanged() {
      if (document.visibilityState === 'visible') resume();
    }
    resume();
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', resume);
      document.removeEventListener('visibilitychange', visibilityChanged);
    };
  }, []);

  async function rate(rating: PracticeRating) {
    if (!item || lock.current || busy) return;
    lock.current = true;
    setError('');
    try {
      await onRate(item, rating);
      setSession((current) => ({ ...current, index: current.index + 1, ratings: [...current.ratings, rating], completedIds: current.scope ? [...current.completedIds, item.id] : current.completedIds }));
      window.scrollTo({ top: 0 });
      setMessage(rating === 'again' ? 'Saved. This will come back tomorrow.' : rating === 'retire' ? 'Retired. You can bring it back from My material.' : 'Saved. You’ll see this again in a few days.');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Couldn’t save this attempt. Please try again.');
    } finally {
      lock.current = false;
    }
  }

  async function undo() {
    if (lock.current || busy) return;
    lock.current = true;
    setError('');
    try {
      const restored = await onUndo();
      if (restored) {
        setSession((current) => current.queue[current.index - 1]?.id === restored.id
          ? { ...current, index: current.index - 1, ratings: current.ratings.slice(0, -1), completedIds: current.completedIds.filter((id) => id !== restored.id) }
          : { ...current, queue: [...current.queue.slice(0, current.index), restored, ...current.queue.slice(current.index)], ratings: current.ratings.slice(0, -1), completedIds: current.completedIds.filter((id) => id !== restored.id) });
        setMessage('Undone. Your previous schedule is restored.');
        window.scrollTo({ top: 0 });
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Couldn’t undo the last answer.');
    } finally { lock.current = false; }
  }

  function more() {
    const day = localDay();
    const activeScope = day === session.day ? session.scope : undefined;
    const completedIds = activeScope ? session.completedIds : [];
    sessionDay.current = day;
    setSession({ queue: activeScope ? buildScopedPracticeQueue(practiceItems, states, lessons, activeScope, completedIds) : buildPracticeQueue(practiceItems, states, lessons), index: 0, ratings: [], day, scope: activeScope, completedIds });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0 });
  }

  return (
    <main className="daily-practice">
      <header className="practice-heading"><div>{session.scope ? <button type="button" className="practice-text-button" onClick={onDaily} disabled={busy}><ArrowLeft size={14} />Return to daily</button> : null}<h1>{session.scope?.title ?? 'Today’s practice'}</h1></div>{session.queue.length > 0 ? <div className="practice-session-count"><strong>{Math.min(completed + (item ? 1 : 0), session.queue.length)}</strong><span> / {session.queue.length}</span></div> : null}</header>
      {session.queue.length > 0 ? <div className="practice-progress" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={session.queue.length} aria-valuenow={completed}>{session.queue.map((entry, index) => <span key={`${entry.id}-${index}`} data-complete={index < completed} data-current={index === completed} />)}</div> : null}

      {item ? <PracticeCard key={`${session.day}-${item.id}-${session.index}`} item={item} voiceURI={voiceURI} busy={busy} onRate={rate} /> : (
        <section className="practice-complete">
          <div className="practice-complete__icon"><Check size={28} /></div>
          <h2>{completed ? 'Practice complete.' : session.scope ? 'Nothing to practise here.' : 'You’re all caught up.'}</h2>
          <p>{completed} {completed === 1 ? 'exercise' : 'exercises'} practised.</p>
          {session.ratings.includes('again') ? <span className="practice-complete__note">{session.ratings.filter((rating) => rating === 'again').length} back tomorrow</span> : null}
          <div className="practice-complete__actions">{remaining.length > 0 ? <Button tone="primary" size="lg" onClick={more}>Keep practising <ArrowRight size={18} /></Button> : null}<Button onClick={onMaterial}><BookOpen size={17} />My material</Button></div>
        </section>
      )}

      <p className="practice-sr-only" role="status">{message}</p>
      {session.ratings.length > 0 ? <div className="practice-session-footer"><button type="button" className="practice-text-button" onClick={() => void undo()} disabled={busy}><RotateCcw size={14} />Undo</button></div> : null}
      {error ? <p className="practice-inline-error" role="alert">{error}</p> : null}
    </main>
  );
}
