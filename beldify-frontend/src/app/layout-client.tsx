'use client';

import { Toaster } from 'react-hot-toast';
import { isDebuggingEnabled } from '@/utils/debugMode';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

import '@/i18n/config';
import { useDirection } from '@/hooks/useDirection';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { syncUrlLocale } from '@/i18n/config';
import { LoadingOverlay } from '@/components/ui/loading';

interface RootLayoutClientProps {
  children: ReactNode;
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  const { i18n } = useTranslation();
  const { isRTL } = useDirection();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      setIsClient(true);

      // Get language from URL or localStorage, fallback to 'ma'
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      const savedLang = localStorage.getItem('i18nextLng');
      const initialLang = urlLang || savedLang || 'ma';

      // Set initial language
      if (initialLang !== i18n.language) {
        await i18n.changeLanguage(initialLang);
      }

      setIsLoading(false);
    };

    initializeApp();
  }, []);

  if (isLoading) {
    // Only show loading overlay on first homepage visit
    const isHomepage = typeof window !== 'undefined' && window.location.pathname === '/';
    return <LoadingOverlay showOnlyOnce={isHomepage} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      {/* Navbar is position:sticky (occupies flow space) — no top padding needed */}
      <main className="flex-grow">{children}</main>
      <Footer />
      {isDebuggingEnabled() && (
        <Toaster
          position={isRTL ? 'top-left' : 'top-right'}
          containerStyle={{ direction: isRTL ? 'rtl' : 'ltr' }}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      )}
    </div>
  );
}
