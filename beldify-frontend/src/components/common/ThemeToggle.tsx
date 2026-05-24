'use client';

import { useTheme } from '@/providers/ThemeProvider';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export function ThemeToggle() {
  const { mode, toggleMode } = useTheme();

  return (
    <button
      onClick={toggleMode}
      className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {mode === 'dark' ? (
        <SunIcon className="h-5 w-5 text-amber-500" />
      ) : (
        <MoonIcon className="h-5 w-5 text-indigo-600" />
      )}
    </button>
  );
}
