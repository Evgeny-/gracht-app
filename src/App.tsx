import { useState } from 'react';

import { BottomNav } from './components/BottomNav';
import { useAppData } from './hooks/useAppData';
import { useTheme } from './hooks/useTheme';
import type { TabId } from './lib/navigation';
import { DecksScreen } from './screens/DecksScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { StatsScreen } from './screens/StatsScreen';
import { StudyScreen } from './screens/StudyScreen';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const {
    activeDeckIds,
    downloadBackup,
    error,
    gradeCard,
    loading,
    restoreBackup,
    snapshot,
    stateMap,
    undoLastGrade,
    updateDeckEnabled,
    updateSettings,
  } = useAppData();

  useTheme(snapshot?.settings.theme);

  if (loading) {
    return (
      <div className="app-state">
        <div className="loader" />
        <p>Loading local decks</p>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="app-state">
        <strong>Local data failed to load.</strong>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-content">
        {activeTab === 'home' ? <HomeScreen snapshot={snapshot} onNavigate={setActiveTab} /> : null}
        {activeTab === 'study' ? (
          <StudyScreen
            activeDeckIds={activeDeckIds}
            snapshot={snapshot}
            stateMap={stateMap}
            onGrade={gradeCard}
            onUndo={undoLastGrade}
          />
        ) : null}
        {activeTab === 'decks' ? (
          <DecksScreen snapshot={snapshot} onToggleDeck={updateDeckEnabled} />
        ) : null}
        {activeTab === 'stats' ? <StatsScreen snapshot={snapshot} /> : null}
        {activeTab === 'settings' ? (
          <SettingsScreen
            settings={snapshot.settings}
            onExport={downloadBackup}
            onImport={restoreBackup}
            onSaveSettings={updateSettings}
          />
        ) : null}
      </div>
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
