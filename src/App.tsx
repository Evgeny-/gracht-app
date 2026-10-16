import { Settings2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from './components/Button';
import { useAppData } from './hooks/useAppData';
import { useTheme } from './hooks/useTheme';
import { MaterialScreen } from './practice/MaterialScreen';
import { PracticeScreen } from './practice/PracticeScreen';
import { Preferences } from './practice/Preferences';
import type { PracticeItem, PracticeScope } from './practice/types';
import { usePractice } from './practice/usePractice';
import { VerbScreen } from './verbs/VerbScreen';
import './practice/practice.css';

type Page = 'practice' | 'verbs' | 'material' | 'settings';
const appIconUrl = `${import.meta.env.BASE_URL}app-icon.png`;

export function App() {
  const data = useAppData();
  const practice = usePractice();
  const [page, setPage] = useState<Page>('practice');
  const [sessionKey, setSessionKey] = useState(0);
  const [scope, setScope] = useState<PracticeScope>();
  useTheme(data.snapshot?.settings.theme);

  function navigate(next: Page) {
    setPage(next);
    window.scrollTo({ top: 0 });
  }

  function startPractice(nextScope?: PracticeScope) {
    setScope(nextScope);
    setSessionKey((key) => key + 1);
    navigate('practice');
  }

  async function restoreBackup(file: File) {
    await data.restoreBackup(file);
    await practice.refresh();
    setScope(undefined);
    setSessionKey((key) => key + 1);
  }

  async function restoreItem(item: PracticeItem) {
    await practice.restore(item);
    setScope(undefined);
    setSessionKey((key) => key + 1);
  }

  if (data.loading || practice.loading) return <div className="app-state"><div className="loader" /><p>Getting your practice ready</p></div>;
  if (!data.snapshot || !practice.hasLoaded) return <div className="app-state"><strong>Couldn’t open your local progress.</strong><p>{data.error || practice.error}</p><Button onClick={() => window.location.reload()}>Try again</Button></div>;

  return <div className="practice-shell">
    <header className="practice-header">
      <button className="practice-brand" type="button" aria-label="Gracht daily practice" onClick={() => navigate('practice')}><img src={appIconUrl} alt="" />gracht</button>
      <div className="practice-header__right"><nav className="practice-navigation" aria-label="Main navigation"><button type="button" aria-current={page === 'practice' ? 'page' : undefined} onClick={() => navigate('practice')}>Practice</button><button type="button" aria-current={page === 'verbs' ? 'page' : undefined} onClick={() => navigate('verbs')}>Verbs</button><button type="button" aria-current={page === 'material' ? 'page' : undefined} onClick={() => navigate('material')}>My material</button></nav><button className="practice-icon-button" type="button" aria-label="Settings" aria-pressed={page === 'settings'} onClick={() => navigate(page === 'settings' ? 'practice' : 'settings')}><Settings2 size={20} /></button></div>
    </header>
    <div className="practice-main-content">
      <div hidden={page !== 'practice'}><PracticeScreen key={sessionKey} states={practice.states} busy={practice.busy} voiceURI={data.snapshot.settings.voiceURI} onRate={practice.rate} onUndo={practice.undo} onMaterial={() => navigate('material')} scope={scope} onDaily={() => startPractice()} /></div>
      <div hidden={page !== 'verbs'}><VerbScreen key={sessionKey} states={practice.states} busy={practice.busy} voiceURI={data.snapshot.settings.voiceURI} onRate={practice.rate} onUndo={practice.undo} onRestore={practice.restore} /></div>
      <div hidden={page !== 'material'}><MaterialScreen states={practice.states} busy={practice.busy} onRestore={restoreItem} onPractise={startPractice} /></div>
      {page === 'settings' ? <Preferences settings={data.snapshot.settings} onSave={data.updateSettings} onExport={data.downloadBackup} onImport={restoreBackup} /> : null}
    </div>
  </div>;
}
