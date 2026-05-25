import { Download, Upload } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';

import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { SegmentedControl } from '../components/SegmentedControl';
import { useVoices } from '../hooks/useVoices';
import type { SettingsRecord, StudyInteractionMode, ThemePreference } from '../lib/db';

type SettingsScreenProps = {
  settings: SettingsRecord;
  onSaveSettings: (settings: SettingsRecord) => Promise<void>;
  onExport: () => Promise<void>;
  onImport: (file: File) => Promise<void>;
};

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const directionOptions = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'nl-en', label: 'NL -> EN' },
  { value: 'en-nl', label: 'EN -> NL' },
] as const;

const studyInteractionOptions: { value: StudyInteractionMode; label: string }[] = [
  { value: 'fixed-buttons', label: 'Buttons' },
  { value: 'swipe', label: 'Swipe' },
];

export function SettingsScreen({ settings, onSaveSettings, onExport, onImport }: SettingsScreenProps) {
  const [importError, setImportError] = useState<string>();
  const { dutchVoices, hasSpeech } = useVoices();
  const voiceOptions = useMemo(() => dutchVoices.length > 0 ? dutchVoices : [], [dutchVoices]);

  async function patchSettings(patch: Partial<SettingsRecord>) {
    await onSaveSettings({ ...settings, ...patch });
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImportError(undefined);
      await onImport(file);
      event.target.value = '';
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Backup import failed.');
    }
  }

  return (
    <main className="screen">
      <SectionHeader eyebrow="Local app" title="Settings" />

      <section className="settings-group">
        <SegmentedControl
          label="Theme"
          options={themeOptions}
          value={settings.theme}
          onChange={(theme) => void patchSettings({ theme })}
        />
        <SegmentedControl
          label="Default direction"
          options={[...directionOptions]}
          value={settings.defaultDirection}
          onChange={(defaultDirection) => void patchSettings({ defaultDirection })}
        />
        <SegmentedControl
          label="Study controls"
          options={studyInteractionOptions}
          value={settings.studyInteractionMode}
          onChange={(studyInteractionMode) => void patchSettings({ studyInteractionMode })}
        />
        <p className="settings-hint">
          Buttons keeps Reveal and grading fixed above the tabs. Swipe mode is reserved for the upcoming gesture flow.
        </p>
      </section>

      <section className="settings-group">
        <label className="field">
          <span className="field__label">Daily review target</span>
          <input
            min={1}
            type="number"
            value={settings.dailyTarget}
            onChange={(event) => void patchSettings({ dailyTarget: Number(event.target.value) })}
          />
        </label>
        <label className="field">
          <span className="field__label">New-card comfort limit</span>
          <input
            min={1}
            type="number"
            value={settings.newCardsPerSession}
            onChange={(event) => void patchSettings({ newCardsPerSession: Number(event.target.value) })}
          />
        </label>
      </section>

      <section className="settings-group">
        <label className="field">
          <span className="field__label">Dutch voice</span>
          <select
            disabled={!hasSpeech}
            value={settings.voiceURI ?? ''}
            onChange={(event) => void patchSettings({ voiceURI: event.target.value || undefined })}
          >
            <option value="">Auto Dutch voice</option>
            {voiceOptions.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="settings-group">
        <div className="backup-actions">
          <Button tone="secondary" onClick={() => void onExport()}>
            <Download size={18} />
            Export JSON
          </Button>
          <label className="file-button">
            <Upload size={18} />
            Import JSON
            <input accept="application/json" type="file" onChange={(event) => void handleImport(event)} />
          </label>
        </div>
        {importError ? <p className="error-text">{importError}</p> : null}
      </section>
    </main>
  );
}
