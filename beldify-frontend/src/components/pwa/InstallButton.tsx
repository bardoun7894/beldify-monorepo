'use client';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useEnhancedPWA as usePWA } from '@/contexts/EnhancedPWAContext';
import { useTranslation } from 'react-i18next';

interface InstallButtonProps {
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function InstallButton({ 
  variant = 'primary', 
  size = 'md', 
  className = '' 
}: InstallButtonProps) {
  const { t } = useTranslation();
  const { isInstallable, isInstalled, isIOS, promptInstall, install } = usePWA();

  if (isInstalled) {
    return null; // Don't show if already installed
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      promptInstall(); // Show the modal with instructions
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center gap-2 font-medium transition-colors rounded-lg';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    const variantClasses = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      minimal: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
    };

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  const getButtonText = () => {
    if (isIOS) {
      return t('pwa.button.install_app');
    }
    return isInstallable ? t('pwa.button.install_app') : t('pwa.button.get_app');
  };

  return (
    <button
      onClick={handleClick}
      className={getButtonClasses()}
      title={t('pwa.button.title')}
    >
      <ArrowDownTrayIcon className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />
      {getButtonText()}
    </button>
  );
} 