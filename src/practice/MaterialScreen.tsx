import { ArrowUpRight, ChevronDown, Play, RotateCcw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '../components/Button';
import { AnswerContent } from './AnswerContent';
import { DOCUMENT_URL, lessons, practiceItems, topics } from './library';
import { kindIcons, kindLabels } from './PracticeCard';
import type { PracticeItem, PracticeScope, PracticeState } from './types';

type Props = {
  states: PracticeState[];
  busy: boolean;
  onRestore: (item: PracticeItem) => Promise<void>;
  onPractise: (scope: PracticeScope) => void;
};

type MaterialGroup = { id: string; title: string; subtitle?: string; items: PracticeItem[] };

export function MaterialScreen({ states, busy, onRestore, onPractise }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('active');
  const [groupBy, setGroupBy] = useState<'lesson' | 'topic'>('lesson');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string>();
  const [notice, setNotice] = useState('');
  const stateMap = useMemo(() => new Map(states.map((state) => [state.itemId, state])), [states]);
  const retired = practiceItems.filter((item) => stateMap.get(item.id)?.status === 'retired').length;
  const items = practiceItems.filter((item) => {
    const isRetired = stateMap.get(item.id)?.status === 'retired';
    const searchText = `${item.title} ${item.prompt} ${item.answer} ${item.dutch} ${item.english}`.toLocaleLowerCase();
    return searchText.includes(query.trim().toLocaleLowerCase()) && (filter === 'retired' ? isRetired : !isRetired);
  });
  const groups: MaterialGroup[] = groupBy === 'lesson'
    ? [...lessons].sort((a, b) => b.sortOrder - a.sortOrder).map((lesson) => ({
      id: `lesson:${lesson.id}`,
      title: lesson.date ? new Date(`${lesson.date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', ...(lesson.date.slice(0, 4) !== String(new Date().getFullYear()) ? { year: 'numeric' as const } : {}) }) : lesson.title,
      subtitle: lesson.date ? lesson.title : undefined,
      items: items.filter((item) => item.lessonId === lesson.id),
    }))
    : topics.map((topic) => ({ id: `topic:${topic.id}`, title: topic.title, items: items.filter((item) => item.topicIds.includes(topic.id)) }));
  const visibleGroups = groups.filter((group) => group.items.length > 0);

  async function restore(item: PracticeItem) {
    try { await onRestore(item); setNotice('Back in your practice.'); }
    catch (failure) { setNotice(failure instanceof Error ? failure.message : 'Couldn’t restore this exercise.'); }
  }

  return <main className="practice-material">
    <header className="practice-heading"><h1>My material</h1><a className="practice-icon-button" aria-label="Open the teacher’s document" href={DOCUMENT_URL} target="_blank" rel="noreferrer"><ArrowUpRight size={20} /></a></header>
    <div className="material-tools">
      <label className="material-search"><Search size={17} /><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setExpanded({}); }} placeholder="Find a word or phrase" aria-label="Find a word or phrase" /></label>
      <div className="material-toolbar">
        <div className="material-grouping" aria-label="Group material by"><button type="button" aria-pressed={groupBy === 'lesson'} onClick={() => setGroupBy('lesson')}>Lessons</button><button type="button" aria-pressed={groupBy === 'topic'} onClick={() => setGroupBy('topic')}>Topics</button></div>
        <div className="material-filter" aria-label="Exercise status"><button type="button" aria-pressed={filter === 'active'} onClick={() => setFilter('active')}>In practice</button><button type="button" aria-pressed={filter === 'retired'} onClick={() => setFilter('retired')}>Retired{retired ? ` · ${retired}` : ''}</button></div>
      </div>
    </div>
    {notice ? <p className="material-notice" role="status">{notice}</p> : null}
    {!visibleGroups.length ? <div className="material-empty"><h2>{query ? 'No matches.' : 'Nothing here.'}</h2><p>{query ? 'Try the Dutch word or its English meaning.' : filter === 'retired' ? 'Exercises marked “Too easy” appear here.' : 'Open Retired to bring exercises back.'}</p></div> : visibleGroups.map((group, groupIndex) => {
      const isOpen = expanded[group.id] ?? (Boolean(query.trim()) || (groupBy === 'lesson' && groupIndex === 0));
      return <section className="material-lesson" key={group.id}>
        <div className="material-lesson__heading">
          <button className="material-group-toggle" type="button" aria-expanded={isOpen} onClick={() => setExpanded({ ...expanded, [group.id]: !isOpen })}>
            <ChevronDown size={16} /><span><strong>{group.title}</strong>{group.subtitle ? <small>{group.subtitle}</small> : null}</span><span className="material-group-count" aria-label={`${group.items.length} exercises`}>{group.items.length}</span>
          </button>
          {filter === 'active' ? <button className="material-group-practise" type="button" disabled={busy} aria-label={`Practise ${group.title}`} onClick={() => onPractise({ id: group.id, title: group.title, itemIds: group.items.map((item) => item.id) })}><Play size={13} fill="currentColor" />Practise</button> : null}
        </div>
        {isOpen ? <div className="material-entries">{group.items.map((item) => {
          const Icon = kindIcons[item.kind];
          const state = stateMap.get(item.id);
          const selectionId = `${group.id}:${item.id}`;
          const isSelected = selected === selectionId;
          return <article className="material-entry" key={item.id} data-open={isSelected}>
            <button className="material-entry__toggle" type="button" aria-expanded={isSelected} onClick={() => setSelected(isSelected ? undefined : selectionId)}><span className={`material-entry__icon material-entry__icon--${item.kind}`}><Icon size={17} /></span><span className="material-entry__title"><strong>{item.title}</strong><small>{kindLabels[item.kind]}</small></span><ChevronDown size={16} /></button>
            {isSelected ? <div className="material-entry__detail">
              <p className="material-entry__prompt">{item.prompt}</p>
              <AnswerContent item={item} />
              <div className="material-entry__actions">{state?.status === 'retired' ? <Button disabled={busy} onClick={() => void restore(item)}><RotateCcw size={16} />Bring back</Button> : <Button tone="primary" disabled={busy} onClick={() => onPractise({ id: `item:${item.id}`, title: item.title, itemIds: [item.id] })}><Play size={15} />Practise this</Button>}<span>{state?.lastReviewedAt ? `Last practised ${new Date(state.lastReviewedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}</span></div>
            </div> : null}
          </article>;
        })}</div> : null}
      </section>;
    })}
  </main>;
}
