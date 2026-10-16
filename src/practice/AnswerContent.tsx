import { Lightbulb } from 'lucide-react';
import type { ReactNode } from 'react';

import type { PracticeItem } from './types';

export function AnswerContent({ item, action }: { item: PracticeItem; action?: ReactNode }) {
  const answer = item.kind === 'recall' ? item.answer.split(' · ')[0] : item.answer;
  const hasExample = !answer.includes(item.dutch);
  const repeatsTranslation = item.answerLanguage === 'en' && answer === item.english;

  return <div className={`answer-content answer-content--${item.kind}`}>
    <div className="answer-content__main"><p lang={item.answerLanguage ?? 'nl'}>{answer}</p>{action}</div>
    {hasExample ? <div className="answer-content__example"><p lang="nl">{item.dutch}</p>{!repeatsTranslation ? <p className="answer-content__translation" lang="en">{item.english}</p> : null}</div>
      : !repeatsTranslation ? <p className="answer-content__translation" lang="en">{item.english}</p> : null}
    {item.explanation ? <div className="answer-content__note"><Lightbulb size={17} aria-hidden="true" /><p>{item.explanation}</p></div> : null}
  </div>;
}
