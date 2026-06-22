'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import logger from '@/utils/consoleLogger';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallBanner() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed/standalone
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             (window.navigator as any).standalone ||
             document.referrer.includes('android-app://');
    };

    // Check if iOS
    const checkIOS = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent);
    };

    // Check if user has already dismissed the banner
    const checkDismissed = () => {
      const dismissed = localStorage.getItem('pwa-banner-dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      return dismissedTime > oneDayAgo;
    };

    setIsIOS(checkIOS());
    setIsStandalone(checkStandalone());

    // Don't show if already installed or recently dismissed
    if (checkStandalone() || checkDismissed()) {
      return;
    }

    // Show banner after a delay for user engagement
    const timer = setTimeout(() => {
      const visitCount = parseInt(localStorage.getItem('page-visits') || '0');
      if (visitCount >= 3) { // Show after 3+ page visits
        setShowBanner(true);
      }
    }, 5000); // 5 second delay

    // Handle beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show banner immediately when install prompt is available
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        
        if (result.outcome === 'accepted') {
          logger.log('PWA installed successfully');
        }
        
        setDeferredPrompt(null);
        setShowBanner(false);
      } catch (error) {
        logger.error('Installation failed:', error);
      }
    } else if (isIOS) {
      // For iOS, just hide the banner and let user follow instructions
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  if (!showBanner || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out">
      <div className="px-4 py-3 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Image
              src="/icons/manifest-icon-192.maskable.png"
              alt="Beldify"
              width={24}
              height={24}
              className="rounded"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {t('pwa.banner.title')}
            </p>
            <p className="text-xs text-indigo-200 hidden sm:block">
              {isIOS 
                ? t('pwa.banner.ios_instruction')
                : t('pwa.banner.benefits')
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {deferredPrompt && !isIOS ? (
            <button
              onClick={handleInstall}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>{t('pwa.banner.install_button')}</span>
            </button>
          ) : (
            <button
              onClick={handleInstall}
              className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-30 transition-colors"
            >
              {isIOS ? t('pwa.banner.learn_how_button') : t('pwa.banner.install_button')}
            </button>
          )}
          
          <button
            onClick={handleDismiss}
            className="text-white hover:text-gray-200 transition-colors p-1"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 