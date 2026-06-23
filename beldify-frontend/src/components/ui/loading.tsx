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

  // t already changes identity when the language changes — no need to list i18n.language separately.
  const loadingText = React.useMemo(() => t('common.loading'), [t]);

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
        <div className="absolute inset-0 m-auto w-2.5 h-2.5 bg-indigo-700 rounded-full animate-pulse shadow-sm" />
      </div>

      {showText && (
        <p className="text-sm font-medium text-indigo-700 animate-pulse">
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
  
  // t already changes identity when the language changes — no need to list i18n.language separately.
  const loadingExperience = React.useMemo(() => t('common.loading_experience'), [t]);

  React.useEffect(() => {
    if (showOnlyOnce) {
      let hasShown = false;
      try {
        hasShown = sessionStorage.getItem('hasShownInitialLoader') === 'true';
      } catch {
        /* sessionStorage unavailable (private-mode / sandboxed iframe) */
      }
      if (hasShown) {
        setShowLoader(false);
      } else {
        try {
          sessionStorage.setItem('hasShownInitialLoader', 'true');
        } catch {
          /* ignore */
        }
        const timer = setTimeout(() => setShowLoader(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [showOnlyOnce]);

  if (!showLoader) return null;

  return (
    <div className="fixed inset-0 bg-gray-50 backdrop-blur-sm flex flex-col items-center justify-center gap-6 z-50">
      <div className="relative">
        <div className="absolute -inset-4 bg-indigo-700/5 rounded-full blur-xl" />
        <Loading size="lg" showText />
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="h-1.5 w-44 bg-amber-200 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-indigo-700 rounded-full animate-progress" />
        </div>
        <p className="text-sm font-medium text-indigo-700 animate-pulse">
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
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-indigo-700 text-white hover:bg-indigo-800 hover:shadow-atlas-sm active:scale-[0.98]'
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
      className={`animate-pulse bg-gray-100 rounded-2xl ${className}`}
      role="status"
      aria-label={t('common.loading')}
    />
  );
}
