'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, DevicePhoneMobileIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useEnhancedPWA } from '@/contexts/EnhancedPWAContext';
import { useTranslation } from 'react-i18next';

export default function PWAReminderBanner() {
  const { t } = useTranslation();
  const { isInstalled, isPWAMode, showReminderBanner, dismissReminder } = useEnhancedPWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Only show if app is installed but user is not in PWA mode
    if (isInstalled && !isPWAMode && showReminderBanner) {
      setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 500);
    }
  }, [isInstalled, isPWAMode, showReminderBanner]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      dismissReminder();
    }, 300);
  };

  const handleOpenApp = () => {
    // Try to open the PWA if possible
    // This varies by platform and may not always work
    const appUrl = `${window.location.origin}?mode=pwa`;
    window.open(appUrl, '_blank');
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 start-4 end-4 sm:start-auto sm:end-4 sm:w-80 md:w-96 z-40 transition-all duration-300 ${
        isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-indigo-900 p-1">
        {/* Animated solid border */}
        <div className="absolute inset-0 bg-indigo-800/40 animate-pulse"></div>
        
        <div className="relative bg-white rounded-lg sm:rounded-xl p-3 sm:p-4">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute end-2 top-2 rounded-full bg-gray-100 p-1 hover:bg-gray-200 transition-colors"
          >
            <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
          </button>

          <div className="flex items-start space-x-2 sm:space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-indigo-900 flex items-center justify-center">
                  <DevicePhoneMobileIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <SparklesIcon className="absolute -top-0.5 -end-0.5 sm:-top-1 sm:-end-1 h-4 w-4 sm:h-5 sm:w-5 text-amber-500 animate-pulse" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5 sm:pt-1">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900">
                {t('pwa.reminder.title', 'Use Our App for Better Experience!')}
              </h3>
              <p className="mt-1 text-xs text-gray-600 leading-tight">
                {t('pwa.reminder.message', 'You have our app installed. Open it for faster browsing and exclusive features.')}
              </p>

              {/* Benefits list */}
              <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 sm:py-1 text-xs font-medium text-indigo-700">
                  {t('pwa.reminder.faster', '2x Faster')}
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 sm:py-1 text-xs font-medium text-amber-700">
                  {t('pwa.reminder.offline', 'Works Offline')}
                </span>
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 sm:py-1 text-xs font-medium text-green-700">
                  {t('pwa.reminder.deals', 'Exclusive Deals')}
                </span>
              </div>

              {/* Action buttons */}
              <div className="mt-2 sm:mt-3 flex space-x-2">
                <button
                  onClick={handleOpenApp}
                  className="flex-1 rounded-lg bg-indigo-900 px-3 py-1 sm:py-1.5 text-xs font-semibold text-white hover:bg-indigo-800 transition-colors"
                >
                  {t('pwa.reminder.open_app', 'Open App')}
                </button>
                <button
                  onClick={handleDismiss}
                  className="rounded-lg border border-gray-300 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('pwa.reminder.continue_browser', 'Stay Here')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal reminder version (for less intrusive reminder)
export function PWAMinimalReminder() {
  const { t } = useTranslation();
  const { isInstalled, isPWAMode, showReminderBanner, dismissReminder } = useEnhancedPWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isInstalled && !isPWAMode && showReminderBanner) {
      setIsVisible(true);
    }
  }, [isInstalled, isPWAMode, showReminderBanner]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 start-0 end-0 z-40 bg-indigo-900 py-2 px-3 sm:px-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <DevicePhoneMobileIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white flex-shrink-0" />
          <p className="text-xs sm:text-sm text-white truncate">
            {t('pwa.minimal_reminder', 'Get a better experience with our app!')}
          </p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 ms-2">
          <button
            onClick={() => window.open(`${window.location.origin}?mode=pwa`, '_blank')}
            className="text-xs sm:text-sm font-medium text-white underline hover:no-underline whitespace-nowrap"
          >
            {t('pwa.open', 'Open App')}
          </button>
          <button
            onClick={() => {
              setIsVisible(false);
              dismissReminder();
            }}
            className="text-white hover:text-gray-200 flex-shrink-0"
          >
            <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}