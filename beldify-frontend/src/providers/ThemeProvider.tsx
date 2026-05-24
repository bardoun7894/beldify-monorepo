'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { theme as baseTheme } from '@/theme';

type ThemeMode = 'light' | 'dark';
type Direction = 'ltr' | 'rtl';

interface ThemeContextType {
  theme: typeof baseTheme;
  mode: ThemeMode;
  direction: Direction;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: baseTheme,
  mode: 'light',
  direction: 'ltr',
  setMode: () => null,
  toggleMode: () => null,
});

const RTL_LANGUAGES = ['ar', 'ma'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [direction, setDirection] = useState<Direction>('ltr');
  const { i18n } = useTranslation();

  // Initialize theme from cookie or default to light mode (ignore system preference)
  useEffect(() => {
    const savedMode = Cookies.get('theme-mode') as ThemeMode;
    // Always default to light mode if no explicit user preference
    setMode(savedMode || 'light');
  }, []);

  // Initialize direction based on language
  useEffect(() => {
    const dir = RTL_LANGUAGES.includes(i18n.language) ? 'rtl' : 'ltr';
    setDirection(dir);
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Update document properties when theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    Cookies.set('theme-mode', mode, { expires: 365 });
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const value = {
    theme: baseTheme,
    mode,
    direction,
    setMode,
    toggleMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
