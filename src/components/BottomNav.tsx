import { BarChart3, BookOpen, Home, Library, Settings } from 'lucide-react';

import type { TabId } from '../lib/navigation';

type BottomNavProps = {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
};

const items = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'study', label: 'Study', Icon: BookOpen },
  { id: 'decks', label: 'Decks', Icon: Library },
  { id: 'stats', label: 'Stats', Icon: BarChart3 },
  { id: 'settings', label: 'Settings', Icon: Settings },
] satisfies { id: TabId; label: string; Icon: typeof Home }[];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {items.map(({ id, label, Icon }) => (
        <button
          className="bottom-nav__item"
          data-active={activeTab === id}
          key={id}
          type="button"
          onClick={() => onChange(id)}
        >
          <Icon aria-hidden="true" size={21} strokeWidth={2.2} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
