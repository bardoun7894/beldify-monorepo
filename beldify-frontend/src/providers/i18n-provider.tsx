'use client';

import { I18nextProvider } from 'react-i18next';
import { useEffect, useState } from 'react';
import i18n from '@/i18n/config';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Ensure i18n is initialized
    if (!initialized && i18n.isInitialized) {
      setInitialized(true);
    } else if (!initialized) {
      i18n.init().then(() => setInitialized(true));
    }
  }, [initialized]);

  // Show loading state while initializing
  if (!initialized) {
    return null; // or a loading spinner
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
