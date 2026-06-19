'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, SparklesIcon, BoltIcon, HeartIcon, BellIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { useEnhancedPWA } from '@/contexts/EnhancedPWAContext';
import { useTranslation } from 'react-i18next';

export default function ModernInstallPrompt() {
  const { t } = useTranslation();
  const { 
    deferredPrompt, 
    isInstallable, 
    isInstalled, 
    isIOS, 
    showInstallPrompt, 
    dismissInstallPrompt, 
    install 
  } = useEnhancedPWA();

  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (showInstallPrompt) {
      setIsAnimating(true);
    }
  }, [showInstallPrompt]);

  const handleInstall = async () => {
    const result = await install();
    if (result) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        dismissInstallPrompt();
      }, 2000);
    }
  };

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => dismissInstallPrompt(), 300);
  };

  const handleRemindLater = () => {
    localStorage.setItem('pwa-remind-later', Date.now().toString());
    handleDismiss();
  };

  // Render when the scoring engine decides the timing is right (showInstallPrompt=true)
  // and the user is not already installed. The 24h dismiss guard and adaptive threshold
  // live in EnhancedPWAContext. Scroll auto-show remains disabled (see EnhancedPWAContext).
  if (!showInstallPrompt || isInstalled) {
    return null;
  }

  const benefits = [
    { icon: BoltIcon, text: t('pwa.benefits.lightning_fast', 'Lightning fast loading'), color: 'text-amber-500' },
    { icon: HeartIcon, text: t('pwa.benefits.save_favorites', 'Save your favorites offline'), color: 'text-red-500' },
    { icon: BellIcon, text: t('pwa.benefits.exclusive_deals', 'Get exclusive deal alerts'), color: 'text-indigo-600' },
    { icon: SparklesIcon, text: t('pwa.benefits.one_tap', 'One-tap access from home'), color: 'text-purple-500' }
  ];

  return (
    <Transition.Root show={showInstallPrompt && isAnimating} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleDismiss}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                {showSuccess ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <CheckCircleIcon className="h-20 w-20 text-green-500 animate-bounce" />
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">
                      {t('pwa.success.title', 'Successfully Installed!')}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 text-center">
                      {t('pwa.success.message', 'You can now access our app from your home screen')}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Solid Color Header */}
                    <div className="relative overflow-hidden bg-indigo-900 px-4 py-6 sm:px-6 sm:py-8">
                      <button
                        onClick={handleDismiss}
                        className="absolute end-3 top-3 sm:end-4 sm:top-4 rounded-full bg-white bg-opacity-20 p-1.5 sm:p-2 text-white hover:bg-opacity-30 transition-all"
                      >
                        <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      
                      <div className="relative flex items-center space-x-3 sm:space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-white shadow-lg flex items-center justify-center">
                            <Image
                              src="/icons/manifest-icon-192.maskable.png"
                              alt={t('pwa.app_icon_alt', 'App icon')}
                              width={32}
                              height={32}
                              className="sm:w-12 sm:h-12 rounded-lg sm:rounded-xl"
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Dialog.Title as="h3" className="text-lg sm:text-2xl font-bold text-white">
                            {t('pwa.modern.title', 'Shop Smarter, Faster')}
                          </Dialog.Title>
                          <p className="mt-1 text-xs sm:text-sm text-indigo-100">
                            {t('pwa.modern.subtitle', 'Install our app for the best shopping experience')}
                          </p>
                        </div>
                      </div>

                      {/* Animated dots */}
                      <div className="absolute -end-2 top-6 sm:-end-4 sm:top-8 flex space-x-1">
                        <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 animate-pulse rounded-full bg-white opacity-40"></span>
                        <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 animate-pulse rounded-full bg-white opacity-40 animation-delay-200"></span>
                        <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 animate-pulse rounded-full bg-white opacity-40 animation-delay-400"></span>
                      </div>
                    </div>

                    {/* Benefits Grid */}
                    <div className="px-4 py-4 sm:px-6 sm:py-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {benefits.map((benefit, index) => (
                          <div
                            key={index}
                            className="group relative rounded-lg border border-gray-200 p-3 transition-all hover:border-indigo-900 hover:shadow-md"
                          >
                            <div className="flex items-start space-x-2 sm:space-x-3">
                              <benefit.icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${benefit.color} transition-transform group-hover:scale-110`} />
                              <span className="text-xs sm:text-sm text-gray-700 leading-tight">{benefit.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Platform-specific Instructions */}
                      {isIOS && (
                        <div className="mt-3 sm:mt-4 rounded-lg bg-amber-50 p-3">
                          <div className="flex items-start space-x-2">
                            <DevicePhoneMobileIcon className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-amber-900">
                                {t('pwa.modern.ios_hint', 'iOS Quick Install:')}
                              </p>
                              <p className="mt-1 text-xs text-amber-800">
                                {t('pwa.modern.ios_instruction', 'Tap the share button and select "Add to Home Screen"')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:py-4">
                      <div className="flex flex-col space-y-2 sm:space-y-3 md:flex-row md:space-x-3 md:space-y-0">
                        {deferredPrompt && !isIOS ? (
                          <button
                            type="button"
                            onClick={handleInstall}
                            className="inline-flex flex-1 justify-center items-center rounded-lg sm:rounded-xl bg-indigo-900 px-4 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-800 transform transition-all hover:scale-105"
                          >
                            <BoltIcon className="me-2 h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-xs sm:text-sm">{t('pwa.modern.install_now', 'Install Now - It\'s Free!')}</span>
                          </button>
                        ) : isIOS ? (
                          <button
                            type="button"
                            onClick={handleDismiss}
                            className="inline-flex flex-1 justify-center items-center rounded-lg sm:rounded-xl bg-indigo-900 px-4 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-800"
                          >
                            <span className="text-xs sm:text-sm">{t('pwa.modern.got_it', 'Got it!')}</span>
                          </button>
                        ) : null}
                        
                        <button
                          type="button"
                          onClick={handleRemindLater}
                          className="inline-flex flex-1 justify-center items-center rounded-lg sm:rounded-xl border border-gray-300 bg-white px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 md:flex-initial"
                        >
                          <span className="text-xs sm:text-sm">{t('pwa.modern.maybe_later', 'Maybe Later')}</span>
                        </button>
                      </div>
                      
                      <p className="mt-2 sm:mt-3 text-center text-xs text-gray-500">
                        {t('pwa.modern.no_download', 'No app store needed • Installs in seconds')}
                      </p>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}