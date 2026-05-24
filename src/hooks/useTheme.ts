import { useEffect } from 'react';

import type { ThemePreference } from '../lib/db';

export function useTheme(theme: ThemePreference | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme ?? 'system';
  }, [theme]);
}
