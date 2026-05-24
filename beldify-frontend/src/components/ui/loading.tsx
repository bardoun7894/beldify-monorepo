import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function Loading({ size = 'md', className = '', showText = false }: LoadingProps) {
  const { t, i18n } = useTranslation();

  // Use a key to force re-render when language changes
  const loadingText = React.useMemo(() => t('common.loading'), [t, i18n.language]);

  return (
    <div className="flex flex-col items-center justify-center relative gap-2">
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        {/* Shimmer background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/30 to-transparent animate-shimmer" />

        {/* Animated rings */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 border-[3px] border-amber-500/20 rounded-full animate-ping" />
          <div className="absolute inset-0 border-[3px] border-amber-500/40 rounded-full animate-ping [animation-delay:0.2s]" />
          <div className="absolute inset-0 border-[3px] border-amber-500/60 rounded-full animate-ping [animation-delay:0.4s]" />
        </div>

        {/* Center dot with gradient */}
        <div className="absolute inset-0 m-auto w-2.5 h-2.5 bg-gradient-to-br from-amber-500 to-indigo-600 rounded-full animate-pulse shadow-lg shadow-amber-500/20" />
      </div>

      {showText && (
        <p className="text-sm font-medium bg-gradient-to-r from-amber-500 to-indigo-600 bg-clip-text text-transparent animate-pulse">
          {loadingText}
        </p>
      )}
      <span className="sr-only">{loadingText}</span>
    </div>
  );
}

// Full page loading overlay with improved design
export function LoadingOverlay({ showOnlyOnce = false }) {
  const { t, i18n } = useTranslation();
  const [showLoader, setShowLoader] = React.useState(true);
  
  // Use a key to force re-render when language changes - moved outside conditional
  const loadingExperience = React.useMemo(() => t('common.loading_experience'), [t, i18n.language]);

  React.useEffect(() => {
    if (showOnlyOnce) {
      const hasShown = sessionStorage.getItem('hasShownInitialLoader');
      if (hasShown) {
        setShowLoader(false);
      } else {
        sessionStorage.setItem('hasShownInitialLoader', 'true');
        const timer = setTimeout(() => setShowLoader(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [showOnlyOnce]);

  if (!showLoader) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white via-amber-50/90 to-indigo-50/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6 z-50">
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/10 to-indigo-600/10 rounded-full blur-xl animate-pulse" />
        <Loading size="lg" showText />
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="h-1.5 w-44 bg-gradient-to-r from-amber-100 to-indigo-100 rounded-full overflow-hidden shadow-inner">
          <div className="h-full w-1/2 bg-gradient-to-r from-amber-500 to-indigo-600 rounded-full animate-progress shadow-lg" />
        </div>
        <p className="text-sm font-medium bg-gradient-to-r from-amber-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
          {loadingExperience}
        </p>
      </div>
    </div>
  );
}

// Loading button state
export function LoadingButton({
  children,
  isLoading,
  disabled,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`relative px-4 py-2 font-medium rounded-lg transition-all duration-200
        ${isLoading ? 'text-transparent' : ''}
        ${
          disabled || isLoading
            ? 'bg-gray-100 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white hover:shadow-md hover:shadow-amber-500/20 active:scale-[0.98]'
        }
        ${className}`}
      {...props}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loading size="sm" className="border-t-white" showText={false} />
        </div>
      )}
      {children}
    </button>
  );
}

// Loading skeleton
export function LoadingSkeleton({ className = '' }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-amber-100/50 to-indigo-100/50 rounded ${className}`}
      role="status"
      aria-label={t('common.loading')}
    />
  );
}
