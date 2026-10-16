import { ChevronDown } from 'lucide-react';

export function VerbGuide() {
  return <details className="verb-guide">
    <summary><span>How the past works</span><ChevronDown size={17} /></summary>
    <div className="verb-guide__body">
      <div className="verb-guide__comparison">
        <section>
          <h2>Simple past <span>OVT</span></h2>
          <p lang="nl">Ik <strong>nam</strong> de trein.</p>
          <p className="verb-guide__meaning">I took the train.</p>
          <p className="verb-guide__note">Often used to tell a story or describe a past situation.</p>
          <div className="verb-guide__pair" lang="nl"><span>ik nam</span><span>wij namen</span></div>
        </section>
        <section>
          <h2>Perfect <span>VTT</span></h2>
          <p lang="nl">Ik <strong>heb</strong> de trein <strong>genomen</strong>.</p>
          <p className="verb-guide__meaning">I took / have taken the train.</p>
          <p className="verb-guide__note">Often used to report a completed event. Use hebben or zijn + a participle.</p>
          <div className="verb-guide__pair" lang="nl"><span>ik heb genomen</span><span>wij hebben genomen</span></div>
          <p className="verb-guide__note">The helper changes with the subject; <i lang="nl">genomen</i> stays the same.</p>
        </section>
      </div>
      <p className="verb-guide__note">Both describe the past. Dutch perfect also works with <i lang="nl">gisteren</i> (yesterday), so English tense alone does not tell you which Dutch form to use.</p>
      <section className="verb-guide__auxiliary">
        <h2>Hebben or zijn?</h2>
        <p className="verb-guide__note">Learn the helper with the example. With <i lang="nl">lopen</i>, the meaning changes the choice:</p>
        <dl><div><dt>Activity</dt><dd lang="nl">Ik <strong>heb</strong> een uur gelopen.</dd><dd>I walked for an hour.</dd></div><div><dt>Destination</dt><dd lang="nl">Ik <strong>ben</strong> naar huis gelopen.</dd><dd>I walked home.</dd></div></dl>
      </section>
      <a className="practice-text-button" href="https://taaladvies.net/werkwoordstijden-die-iets-over-het-verleden-zeggen-voltooide-versus-onvoltooide-tijden-algemeen/" target="_blank" rel="noreferrer">Read more at Taaladvies ↗</a>
    </div>
  </details>;
}
