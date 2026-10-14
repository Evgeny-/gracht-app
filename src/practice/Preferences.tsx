import { Download, Moon, Sun, Upload } from 'lucide-react';
import { useState } from 'react';
import type { ChangeEvent } from 'react';

import { Button } from '../components/Button';
import { useVoices } from '../hooks/useVoices';
import type { SettingsRecord, ThemePreference } from '../lib/db';

type Props = {
  settings: SettingsRecord;
  onSave: (settings: SettingsRecord) => Promise<void>;
  onExport: () => Promise<void>;
  onImport: (file: File) => Promise<void>;
};

export function Preferences({ settings, onSave, onExport, onImport }: Props) {
  const { dutchVoices, hasSpeech } = useVoices();
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [importFile, setImportFile] = useState<File>();
  async function run(work: () => Promise<void>, success = '') {
    setPending(true); setMessage('');
    try { await work(); setMessage(success); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.'); }
    finally { setPending(false); }
  }
  function chooseFile(event: ChangeEvent<HTMLInputElement>) { setImportFile(event.target.files?.[0]); event.target.value = ''; }

  return <main className="practice-preferences">
    <header className="practice-heading"><h1>Settings</h1></header>
    <section className="practice-setting"><h2>Appearance</h2><div className="preference-segments">{(['system', 'light', 'dark'] as ThemePreference[]).map((theme) => <button type="button" key={theme} aria-pressed={settings.theme === theme} disabled={pending} onClick={() => void run(() => onSave({ ...settings, theme }))}>{theme === 'light' ? <Sun size={15} /> : theme === 'dark' ? <Moon size={15} /> : null}{theme[0].toUpperCase() + theme.slice(1)}</button>)}</div></section>
    <section className="practice-setting"><div><h2>Dutch pronunciation</h2><p>Uses the voices available on this device.</p></div><select aria-label="Dutch voice" value={settings.voiceURI ?? ''} disabled={!hasSpeech || pending} onChange={(event) => void run(() => onSave({ ...settings, voiceURI: event.target.value || undefined }))}><option value="">Automatic Dutch voice</option>{dutchVoices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name}</option>)}</select></section>
    <section className="practice-setting"><div><h2>Keep a backup</h2><p>Your progress stays in this browser. Save a copy to move it to another device.</p></div><div className="practice-backup-actions"><Button disabled={pending} onClick={() => void run(onExport, 'Backup downloaded.')}><Download size={17} />Export backup</Button><label className="file-button"><Upload size={17} />Import backup<input type="file" accept="application/json,.json" onChange={chooseFile} disabled={pending} /></label></div>{importFile ? <div className="practice-import-confirm"><p>Restore <strong>{importFile.name}</strong>? This replaces progress included in that backup.</p><div><Button disabled={pending} tone="primary" onClick={() => void run(async () => { await onImport(importFile); setImportFile(undefined); }, 'Backup restored.')} >Restore backup</Button><Button disabled={pending} onClick={() => setImportFile(undefined)}>Cancel</Button></div></div> : null}</section>
    {message ? <p className="material-notice" role="status">{message}</p> : null}
  </main>;
}
