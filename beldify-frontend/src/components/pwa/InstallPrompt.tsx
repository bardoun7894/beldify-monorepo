'use client';

import { XMarkIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useEnhancedPWA as usePWA } from '@/contexts/EnhancedPWAContext';
import { useTranslation } from 'react-i18next';

export default function InstallPrompt() {
  const { t } = useTranslation();
  const { 
    deferredPrompt, 
    isInstallable, 
    isInstalled, 
    isIOS, 
    showInstallPrompt, 
    dismissInstallPrompt, 
    install 
  } = usePWA();

  const handleInstall = async () => {
    await install();
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
  };

  const handleRemindLater = () => {
    dismissInstallPrompt();
  };

  if (!showInstallPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white hover:text-gray-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <Image
                src="/icons/manifest-icon-192.maskable.png"
                alt="Beldify"
                width={32}
                height={32}
                className="rounded"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('pwa.prompt.title')}</h3>
              <p className="text-indigo-100 text-sm">{t('pwa.prompt.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">{t('pwa.prompt.why_install')}</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                <span>{t('pwa.prompt.benefits.faster')}</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                <span>{t('pwa.prompt.benefits.offline')}</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                <span>{t('pwa.prompt.benefits.notifications')}</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                <span>{t('pwa.prompt.benefits.home_screen')}</span>
              </li>
            </ul>
          </div>

          {isIOS ? (
            // iOS Instructions
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                <DevicePhoneMobileIcon className="w-5 h-5 mr-2" />
                {t('pwa.prompt.ios_title')}
              </h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>{t('pwa.prompt.ios_steps.step1')}</li>
                <li>{t('pwa.prompt.ios_steps.step2')}</li>
                <li>{t('pwa.prompt.ios_steps.step3')}</li>
              </ol>
            </div>
          ) : (
            // Chrome/Edge/Android Instructions
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                <ComputerDesktopIcon className="w-5 h-5 mr-2" />
                {t('pwa.prompt.install_now')}
              </h4>
              <p className="text-sm text-green-700">
                {t('pwa.prompt.install_description')}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {deferredPrompt && !isIOS ? (
              <button
                onClick={handleInstall}
                className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                {t('pwa.prompt.install_button')}
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                {t('pwa.prompt.got_it_button')}
              </button>
            )}
            <button
              onClick={handleRemindLater}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              {t('pwa.prompt.remind_later')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 