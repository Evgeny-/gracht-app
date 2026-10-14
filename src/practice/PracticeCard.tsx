import { Check, Eye, FastForward, GitCompareArrows, Layers2, MessageCircle, RotateCcw, Shuffle, Volume2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../components/Button';
import { speakDutch } from '../lib/speech';
import { AnswerContent } from './AnswerContent';
import type { PracticeItem, PracticeRating } from './types';

export const kindLabels = { recall: 'Say it in Dutch', contrast: 'Know the difference', build: 'Build a phrase', verb: 'Change the sentence' };
export const kindIcons = { recall: MessageCircle, contrast: GitCompareArrows, build: Layers2, verb: Shuffle };

function normalize(text: string) {
  return text.toLocaleLowerCase('nl').replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();
}

type PracticeCardProps = {
  item: PracticeItem;
  busy: boolean;
  voiceURI?: string;
  onRate: (rating: PracticeRating) => Promise<void>;
};

export function PracticeCard({ item, busy, voiceURI, onRate }: PracticeCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [chosen, setChosen] = useState<number[]>([]);
  const [tokenOrder] = useState(() => {
    const order = (item.tokens ?? []).map((_, index) => index);
    for (let index = order.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [order[index], order[other]] = [order[other], order[index]];
    }
    if (order.every((index, position) => item.tokens?.[index] === item.tokens?.[position])) order.reverse();
    return order;
  });
  const [reference, setReference] = useState(0);
  const [audioError, setAudioError] = useState('');
  const KindIcon = kindIcons[item.kind];
  const recallHint = item.kind === 'recall'
    ? item.prompt.replace(/^(?:How do you say [^?]+\?|Say [^.]+\.)\s*(?:Then\s+)?/u, '').replace(/^./u, (letter) => letter.toUpperCase())
    : '';
  const assembled = chosen.map((index) => item.tokens?.[index]).join(' ');
  const matches = [item.answer, ...(item.acceptedAnswers ?? [])].some((answer) => normalize(answer) === normalize(assembled));

  function listen() {
    setAudioError('');
    const available = speakDutch(item.dutch, voiceURI, () => setAudioError('Dutch audio isn’t available in this browser right now.'));
    if (!available) setAudioError('This browser doesn’t support speech playback.');
  }

  return (
    <article className={`practice-card practice-card--${item.kind}`} aria-label={kindLabels[item.kind]}>
      <div className="practice-card__top">
        <div className="practice-kind"><span className="practice-kind__icon"><KindIcon size={17} strokeWidth={2} /></span>{kindLabels[item.kind]}</div>
      </div>

      <div className="practice-prompt">
        <h2>{item.kind === 'recall' ? item.title : item.prompt}</h2>
        {recallHint ? <p className="practice-task-description">{recallHint}</p> : null}
      </div>

      {item.kind === 'build' && item.tokens ? (
        <div className="phrase-builder">
          <div className="phrase-builder__sentence" aria-label="Your sentence" aria-live="polite">
            {chosen.length ? chosen.map((tokenIndex, index) => (
              <button type="button" className="phrase-piece phrase-piece--chosen" key={`${tokenIndex}-${index}`} disabled={revealed || busy} aria-label={`Remove ${item.tokens![tokenIndex]}`} onClick={() => setChosen(chosen.filter((_, position) => position !== index))}>{item.tokens![tokenIndex]}</button>
            )) : <span>Tap the words to make your sentence.</span>}
          </div>
          {!revealed ? <div className="phrase-builder__bank">{tokenOrder.map((index) => <button className="phrase-piece" type="button" key={index} disabled={chosen.includes(index) || busy} onClick={() => setChosen([...chosen, index])}>{item.tokens![index]}</button>)}<button className="practice-text-button phrase-reset" type="button" aria-label="Clear your sentence" disabled={!chosen.length} onClick={() => setChosen([])}><RotateCcw size={16} /></button></div> : null}
        </div>
      ) : null}

      {revealed ? (
        <div className="practice-answer" aria-live="polite">
          <AnswerContent item={item} action={<button type="button" className="practice-listen" onClick={listen} aria-label="Listen to the Dutch example"><Volume2 size={18} /></button>} />
          {item.kind === 'build' && chosen.length > 0 ? <p className="practice-builder-feedback">{matches ? <><Check size={15} /> Your sentence works.</> : 'Compare your sentence with the example above.'}</p> : null}
          {item.reference?.length ? (
            <div className="verb-reference">
              <div className="verb-reference__tabs" aria-label="Explore the forms">{item.reference.map((variant, index) => <button key={variant.label} type="button" aria-pressed={reference === index} onClick={() => setReference(index)}>{variant.label}</button>)}</div>
              <p lang="nl">{item.reference[reference].dutch}</p>
            </div>
          ) : null}
          {audioError ? <p className="practice-inline-error" role="status">{audioError}</p> : null}
        </div>
      ) : null}

      <div className="practice-card__actions">
        {revealed ? (
          <fieldset className="practice-rating" disabled={busy} aria-label="Rate your answer">
            <div className="practice-rating__buttons">
              <button className="practice-rating-button practice-rating-button--again" type="button" onClick={() => void onRate('again')}><RotateCcw size={18} /><strong>Again</strong><span>Tomorrow</span></button>
              <button className="practice-rating-button practice-rating-button--good" type="button" onClick={() => void onRate('good')}><Check size={19} /><strong>Got it</strong><span>Space it out</span></button>
              <button className="practice-rating-button practice-rating-button--retire" type="button" onClick={() => void onRate('retire')}><FastForward size={18} /><strong>Too easy</strong><span>Don’t repeat</span></button>
            </div>
          </fieldset>
        ) : (
          <Button tone="primary" size="lg" className="practice-reveal" disabled={busy} onClick={() => setRevealed(true)}><Eye size={19} />{item.kind === 'build' ? 'Compare my sentence' : 'Show the answer'}</Button>
        )}
      </div>
    </article>
  );
}
