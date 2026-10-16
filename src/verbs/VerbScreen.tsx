import { ArrowRight, ChevronDown, Play, RotateCcw, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '../components/Button';
import { speakDutch } from '../lib/speech';
import { PracticeScreen } from '../practice/PracticeScreen';
import { isPracticeDue } from '../practice/scheduler';
import type { PracticeItem, PracticeRating, PracticeScope, PracticeState } from '../practice/types';
import { sources, verbGroups, verbItems, verbs } from './library';
import { buildVerbQueue } from './scheduler';
import type { IrregularVerb } from './types';
import { VerbGuide } from './VerbGuide';
import './verbs.css';

type Props = {
  states: PracticeState[];
  busy: boolean;
  voiceURI?: string;
  onRate: (item: PracticeItem, rating: PracticeRating) => Promise<void>;
  onUndo: (expectedItemId?: string) => Promise<PracticeItem | undefined>;
  onRestore: (item: PracticeItem) => Promise<void>;
};

function VerbForms({ verb }: { verb: IrregularVerb }) {
  return <dl className="verb-forms">
    <div><dt>Present</dt><dd lang="nl">ik {verb.present.ik}</dd></div>
    <div><dt>Simple past · one</dt><dd lang="nl">ik {verb.past.singular}</dd></div>
    <div><dt>Simple past · plural</dt><dd lang="nl">wij {verb.past.plural}</dd></div>
    <div><dt>{verb.perfect.note ? 'Perfect · this example' : 'Perfect'}</dt><dd lang="nl">ik {verb.perfect.auxiliary === 'zijn' ? 'ben' : 'heb'} {verb.perfect.participle}</dd></div>
  </dl>;
}

export function VerbScreen({ states, busy, voiceURI, onRate, onUndo, onRestore }: Props) {
  const [session, setSession] = useState<{ scope?: PracticeScope }>();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string>();
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: number;
    function schedule() {
      const date = new Date();
      const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      timer = window.setTimeout(resume, midnight.getTime() - date.getTime() + 25);
    }
    function resume() {
      window.clearTimeout(timer);
      setNow(new Date());
      schedule();
    }
    function visibilityChanged() {
      if (document.visibilityState === 'visible') resume();
    }
    schedule();
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', resume);
      document.removeEventListener('visibilitychange', visibilityChanged);
    };
  }, []);
  const stateMap = new Map(states.map((state) => [state.itemId, state]));
  const preview = buildVerbQueue(states, undefined, [], now);
  const nextVerbs = [...new Set(preview.map((item) => item.verbId))]
    .map((id) => verbs.find((verb) => verb.id === id)?.infinitive).filter(Boolean);
  const dueCount = verbItems.filter((item) => {
    const state = stateMap.get(item.id);
    return state && state.reviews > 0 && isPracticeDue(item, state, now);
  }).length;

  function start(scope?: PracticeScope) {
    setSession({ scope });
    setNotice('');
    window.scrollTo({ top: 0 });
  }

  function browse() {
    setSession(undefined);
    window.scrollTo({ top: 0 });
  }

  async function restore(item: PracticeItem) {
    try { await onRestore(item); setNotice('Question back in practice.'); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Couldn’t restore this question.'); }
  }

  function listen(verb: IrregularVerb) {
    setNotice('');
    const available = speakDutch(verb.examples.perfect.dutch, voiceURI, () => setNotice('Dutch audio isn’t available in this browser right now.'));
    if (!available) setNotice('This browser doesn’t support speech playback.');
  }

  if (session) return <PracticeScreen
    states={states} busy={busy} voiceURI={voiceURI} onRate={onRate} onUndo={onUndo}
    items={verbItems} queueBuilder={buildVerbQueue} title="Verb practice" scope={session.scope}
    backLabel="All verbs" materialLabel="Browse verbs" onDaily={browse} onMaterial={browse}
  />;

  return <main className="verbs-screen">
    <header className="practice-heading"><h1>Irregular verbs</h1><span className="verbs-total">{verbs.length} verbs</span></header>
    <section className="verb-start">
      <div>
        <h2 lang={preview.length ? 'nl' : 'en'}>{preview.length ? nextVerbs.slice(0, 3).join(' · ') + (nextVerbs.length > 3 ? '…' : '') : 'All caught up.'}</h2>
        <p>{preview.length ? `${preview.length} questions${dueCount ? ` · ${dueCount} due for review` : ''}` : 'Pick a verb below to practise more.'}</p>
      </div>
      {preview.length ? <Button tone="primary" size="lg" disabled={busy} onClick={() => start()}>Practise <ArrowRight size={18} /></Button> : null}
    </section>

    <VerbGuide />
    {notice ? <p className="material-notice" role="status">{notice}</p> : null}

    {verbGroups.map((group, groupIndex) => {
      const groupVerbs = verbs.filter((verb) => verb.groupId === group.id);
      const groupIds = new Set(groupVerbs.map((verb) => verb.id));
      const groupItems = verbItems.filter((item) => groupIds.has(item.verbId!));
      const isActive = (item: PracticeItem) => stateMap.get(item.id)?.status !== 'retired' || item.revision > (stateMap.get(item.id)?.revision ?? 0);
      const isOpen = expanded[group.id] ?? groupIndex === 0;
      return <section className="verb-group" key={group.id}>
        <div className="material-lesson__heading">
          <button type="button" className="material-group-toggle" aria-expanded={isOpen} onClick={() => setExpanded({ ...expanded, [group.id]: !isOpen })}>
            <ChevronDown size={16} /><span><strong>{group.title}</strong>{!isOpen ? <small lang="nl">{groupVerbs.map((verb) => verb.infinitive).join(' · ')}</small> : null}</span>
          </button>
          <button type="button" className="material-group-practise" aria-label={`Practise ${group.title}`} disabled={busy || !groupItems.some(isActive)} onClick={() => start({ id: `verbs:${group.id}`, title: group.title, itemIds: groupItems.map((item) => item.id) })}><Play size={13} fill="currentColor" />Practise</button>
        </div>
        {isOpen ? <div className="material-entries">{groupVerbs.map((verb) => {
          const items = groupItems.filter((item) => item.verbId === verb.id);
          const retired = items.filter((item) => !isActive(item));
          const attempted = items.filter((item) => (stateMap.get(item.id)?.reviews ?? 0) > 0).length;
          const isSelected = selected === verb.id;
          return <article className="verb-entry" key={verb.id}>
            <button type="button" className="verb-entry__toggle" aria-expanded={isSelected} onClick={() => setSelected(isSelected ? undefined : verb.id)}>
              <span><strong lang="nl">{verb.infinitive}</strong><small lang="en">{verb.english}</small></span>
              {retired.length === items.length ? <span className="verb-entry__progress">Retired</span> : attempted > 0 ? <span className="verb-entry__progress">{attempted}/{items.length} practised</span> : null}
              <ChevronDown size={16} />
            </button>
            {isSelected ? <div className="verb-entry__detail">
              <VerbForms verb={verb} />
              <div className="verb-example"><div><p lang="nl">{verb.examples.perfect.dutch}</p><p lang="en">{verb.examples.perfect.english}</p></div><button type="button" className="practice-listen" aria-label={`Listen to ${verb.infinitive}`} onClick={() => listen(verb)}><Volume2 size={18} /></button></div>
              {verb.perfect.note || verb.note ? <p className="verb-entry__note">{[verb.perfect.note, verb.note].filter(Boolean).join(' ')}</p> : null}
              <Button tone="primary" disabled={busy || retired.length === items.length} onClick={() => start({ id: `verb:${verb.id}`, title: verb.infinitive, itemIds: items.map((item) => item.id) })}><Play size={15} />Practise {verb.infinitive}</Button>
              {retired.length ? <details className="verb-retired"><summary>Retired questions · {retired.length}</summary>{retired.map((item) => <div key={item.id}><span>{item.label}</span><button type="button" className="practice-text-button" disabled={busy} aria-label={`Bring back ${verb.infinitive}: ${item.label}`} onClick={() => void restore(item)}><RotateCcw size={14} />Bring back</button></div>)}</details> : null}
            </div> : null}
          </article>;
        })}</div> : null}
      </section>;
    })}

    <details className="verb-sources"><summary>Language references</summary><ul>{sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul></details>
  </main>;
}
