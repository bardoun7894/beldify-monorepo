'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import toast from '@/utils/toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isInstalled: boolean;
  isPWAMode: boolean;
  isIOS: boolean;
  showInstallPrompt: boolean;
  showReminderBanner: boolean;
  promptInstall: () => void;
  dismissInstallPrompt: () => void;
  dismissReminder: () => void;
  install: () => Promise<boolean>;
  triggerInstallOnAction: (action: 'checkout' | 'cart' | 'wishlist' | 'order-complete' | 'product-view') => void;
  checkOptimalTiming: () => void;
}

// Default context value so consumers never crash when used outside the provider
// (e.g., if EnhancedPWAProvider errors during initialization).
const defaultPWAContext: PWAContextType = {
  deferredPrompt: null,
  isInstallable: false,
  isInstalled: false,
  isPWAMode: false,
  isIOS: false,
  showInstallPrompt: false,
  showReminderBanner: false,
  promptInstall: () => {},
  dismissInstallPrompt: () => {},
  dismissReminder: () => {},
  install: async () => false,
  triggerInstallOnAction: () => {},
  checkOptimalTiming: () => {},
};

const PWAContext = createContext<PWAContextType>(defaultPWAContext);

// Enhanced engagement tracking
interface UserEngagement {
  pageViews: number;
  timeSpent: number;
  cartValue: number;
  hasWishlist: boolean;
  lastVisit: number;
  installDismissed: number;
  sessionStart: number;
  productsViewed: number;
  cartAbandoned: boolean;
}

export function EnhancedPWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPWAMode, setIsPWAMode] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showReminderBanner, setShowReminderBanner] = useState(false);
  const [engagement, setEngagement] = useState<UserEngagement>({
    pageViews: 0,
    timeSpent: 0,
    cartValue: 0,
    hasWishlist: false,
    lastVisit: Date.now(),
    installDismissed: 0,
    sessionStart: Date.now(),
    productsViewed: 0,
    cartAbandoned: false
  });

  // Advanced install detection
  const checkIfInstalled = useCallback(() => {
    // Check multiple indicators for PWA installation
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebApp = (window.navigator as any).standalone === true;
    const isFromHomeScreen = document.referrer.includes('android-app://');
    
    // Check if running as TWA (Trusted Web Activity)
    const isTWA = document.referrer.includes('android-app://') || 
                  window.matchMedia('(display-mode: fullscreen)').matches;
    
    // Check URL parameters (some PWAs add params when installed)
    const urlParams = new URLSearchParams(window.location.search);
    const isPWAParam = urlParams.get('mode') === 'pwa' || urlParams.get('source') === 'pwa';
    
    return isStandalone || isInWebApp || isFromHomeScreen || isTWA || isPWAParam;
  }, []);

  // Check if user is in PWA mode (for showing reminders)
  const checkPWAMode = useCallback(() => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           window.matchMedia('(display-mode: minimal-ui)').matches;
  }, []);

  // Load and save engagement data
  const loadEngagement = useCallback(() => {
    const saved = localStorage.getItem('pwa-engagement');
    if (saved) {
      try {
        return JSON.parse(saved) as UserEngagement;
      } catch {
        return engagement;
      }
    }
    return engagement;
  }, [engagement]);

  const saveEngagement = useCallback((data: UserEngagement) => {
    localStorage.setItem('pwa-engagement', JSON.stringify(data));
    setEngagement(data);
  }, []);

  // Smart timing algorithm for e-commerce
  const calculateOptimalTiming = useCallback(() => {
    const eng = loadEngagement();
    const timeSinceStart = Date.now() - eng.sessionStart;
    const daysSinceLastVisit = (Date.now() - eng.lastVisit) / (1000 * 60 * 60 * 24);
    
    // Enhanced scoring system for engagement
    let score = 0;
    
    // Progressive time-based scoring with smoother curves
    if (timeSinceStart > 15000) score += 5; // 15 seconds - quick initial engagement
    if (timeSinceStart > 30000) score += 8; // 30 seconds
    if (timeSinceStart > 60000) score += 12; // 1 minute
    if (timeSinceStart > 120000) score += 15; // 2 minutes - serious consideration
    if (timeSinceStart > 300000) score += 20; // 5 minutes - very engaged
    
    // Enhanced behavior scoring with better weights
    if (eng.pageViews >= 2) score += 10; // Started exploring
    if (eng.pageViews >= 3) score += 15; // Active browsing
    if (eng.pageViews >= 5) score += 20; // High engagement
    if (eng.pageViews >= 8) score += 25; // Very interested
    
    if (eng.productsViewed >= 1) score += 15; // Product interest
    if (eng.productsViewed >= 2) score += 25; // Shopping behavior
    if (eng.productsViewed >= 5) score += 30; // Serious shopper
    
    // Cart and wishlist scoring
    if (eng.cartValue > 0) score += 35; // Has items in cart - high intent
    if (eng.cartValue > 500) score += 40; // High-value cart
    if (eng.hasWishlist) score += 25; // Planning future purchases
    if (eng.cartAbandoned) score += 45; // Abandoned cart - critical moment
    
    // Returning visitor patterns
    if (daysSinceLastVisit < 1 && daysSinceLastVisit > 0.1) score += 15; // Same day return
    if (daysSinceLastVisit < 7 && daysSinceLastVisit >= 1) score += 25; // Weekly visitor
    if (daysSinceLastVisit >= 7) score += 10; // Long-term visitor
    
    // Mobile user bonus (PWAs are primarily mobile-focused)
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) score += 15;
    
    // Connection quality bonus (PWAs help with poor connections)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && (connection.effectiveType === '2g' || connection.effectiveType === '3g')) {
        score += 20; // PWA benefits for slower connections
      }
    }
    
    // Enhanced penalty system with progressive backoff
    if (eng.installDismissed > 0) {
      const dismissCount = parseInt(localStorage.getItem('pwa-dismiss-count') || '0');
      const hoursSinceDismissed = (Date.now() - eng.installDismissed) / (1000 * 60 * 60);
      
      if (hoursSinceDismissed < 24) score -= 100; // Don't show for 24 hours
      else if (hoursSinceDismissed < 72) score -= 50; // Reduce significantly for 3 days
      else if (dismissCount >= 3) score -= 30; // Permanent penalty for frequent dismissers
      else score -= 15; // Minor penalty after cooling off
    }
    
    // Dynamic threshold based on user history
    const dismissCount = parseInt(localStorage.getItem('pwa-dismiss-count') || '0');
    const baseThreshold = 50;
    const adaptiveThreshold = baseThreshold + (dismissCount * 10); // Increase threshold for dismissers
    
    return {
      shouldShow: score >= adaptiveThreshold,
      score,
      threshold: adaptiveThreshold,
      dismissCount,
      timing: score >= adaptiveThreshold + 30 ? 'optimal' : score >= adaptiveThreshold ? 'good' : 'wait',
      factors: {
        timeEngagement: timeSinceStart,
        behaviorScore: eng.pageViews + eng.productsViewed,
        intentScore: eng.cartValue + (eng.hasWishlist ? 1 : 0),
        isMobile,
        isReturning: daysSinceLastVisit < 7
      }
    };
  }, [loadEngagement]);

  // Initialize and set up event listeners. Mount-only: registers global PWA event listeners once.
  // Functions like checkIfInstalled, checkPWAMode, isInstalled, isPWAMode, loadEngagement,
  // saveEngagement are intentionally omitted from deps — re-registering on every state change
  // would cause duplicate handlers and break the PWA install flow.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    try {
      // Check installation status
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
      setIsInstalled(checkIfInstalled());
      setIsPWAMode(checkPWAMode());

      // Load previous engagement
      const previousEngagement = loadEngagement();
      const newEngagement = {
        ...previousEngagement,
        pageViews: previousEngagement.pageViews + 1,
        lastVisit: Date.now(),
        sessionStart: Date.now()
      };
      saveEngagement(newEngagement);
    } catch (error) {
      console.warn('EnhancedPWA: Failed to initialize engagement tracking:', error);
    }

    // Handle beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      try {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setIsInstallable(true);
        // Intentionally NOT auto-showing the modal here. The prompt will surface
        // only via engagement triggers (scroll >60%, repeat visits, explicit user
        // action) handled elsewhere — never on first paint, so it can't cover the
        // hero. Users can install via the footer button or browser menu any time.
      } catch (error) {
        console.warn('EnhancedPWA: Error handling install prompt:', error);
      }
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPrompt(false);
      try {
        toast.success('App installed successfully! Find it on your home screen.');
      } catch {
        // Toast may fail silently
      }
    };

    // Track page visibility for engagement
    const handleVisibilityChange = () => {
      try {
        if (document.hidden) {
          const eng = loadEngagement();
          const timeSpent = Date.now() - eng.sessionStart;
          saveEngagement({ ...eng, timeSpent: eng.timeSpent + timeSpent });
        } else {
          const eng = loadEngagement();
          saveEngagement({ ...eng, sessionStart: Date.now() });
        }
      } catch {
        // Silently ignore engagement tracking errors
      }
    };

    // Track scroll depth for engagement
    let maxScroll = 0;
    const handleScroll = () => {
      try {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight <= 0) return;
        const scrollPercentage = (window.scrollY / scrollHeight) * 100;
        if (scrollPercentage > maxScroll) {
          maxScroll = scrollPercentage;
          // Auto-show on scroll disabled — prompt now only via explicit user action.
        }
      } catch {
        // Silently ignore scroll tracking errors
      }
    };

    // Enhanced reminder logic for installed users
    let reminderId: ReturnType<typeof setTimeout> | undefined;
    try {
      if (isInstalled && !isPWAMode) {
        const lastReminder = localStorage.getItem('pwa-last-reminder');
        const reminderCount = parseInt(localStorage.getItem('pwa-reminder-count') || '0');
        const isReduced = localStorage.getItem('pwa-reminder-reduced') === 'true';
        
        const daysSinceReminder = lastReminder ? 
          (Date.now() - parseInt(lastReminder)) / (1000 * 60 * 60 * 24) : 100;
        
        // Progressive reminder intervals: 7, 14, 30 days (or 14, 30, 90 if reduced)
        const intervals = isReduced ? [14, 30, 90] : [7, 14, 30];
        const currentInterval = intervals[Math.min(reminderCount, intervals.length - 1)];
        
        if (daysSinceReminder > currentInterval) {
          // Smart timing based on user activity
          const eng = loadEngagement();
          const isEngaged = eng.timeSpent > 120000 || eng.pageViews >= 3;
          const delay = isEngaged ? 15000 : 5000; // Longer delay if user is engaged

          reminderId = setTimeout(() => {
            // Only show if user is still active and hasn't switched tabs
            if (document.visibilityState === 'visible' && !document.hidden) {
              setShowReminderBanner(true);
            }
          }, delay);
        }
      }
    } catch (error) {
      console.warn('EnhancedPWA: Failed to check reminder status:', error);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(reminderId);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Track cart and wishlist changes
  useEffect(() => {
    const checkCartAndWishlist = () => {
      try {
        const cart = localStorage.getItem('cart');
        const wishlist = localStorage.getItem('wishlist');
        const eng = loadEngagement();
        
        let cartValue = 0;
        if (cart) {
          const cartItems = JSON.parse(cart);
          cartValue = cartItems.reduce((total: number, item: any) => 
            total + (item.price * item.quantity), 0);
        }
        
        saveEngagement({
          ...eng,
          cartValue,
          hasWishlist: wishlist ? JSON.parse(wishlist).length > 0 : false
        });
      } catch (error) {
        console.error('Error checking cart/wishlist:', error);
      }
    };

    const interval = setInterval(checkCartAndWishlist, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [loadEngagement, saveEngagement]);

  const promptInstall = () => {
    if (!isInstalled && !checkRecentlyDismissed()) {
      setShowInstallPrompt(true);
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    const now = Date.now();
    const count = parseInt(localStorage.getItem('pwa-dismiss-count') || '0') + 1;
    
    // Update engagement data
    const eng = loadEngagement();
    saveEngagement({ ...eng, installDismissed: now });
    
    // Track dismissal patterns for smarter future prompts
    localStorage.setItem('pwa-dismiss-count', count.toString());
    localStorage.setItem('pwa-last-dismiss', now.toString());
    
    const dismissals = JSON.parse(localStorage.getItem('pwa-prompt-dismissals') || '[]');
    dismissals.push({ 
      timestamp: now, 
      count, 
      reason: 'user_dismiss',
      engagementScore: calculateOptimalTiming().score,
      pageViews: eng.pageViews,
      timeSpent: eng.timeSpent,
      cartValue: eng.cartValue
    });
    
    // Keep only last 10 dismissals for performance
    if (dismissals.length > 10) {
      dismissals.splice(0, dismissals.length - 10);
    }
    
    localStorage.setItem('pwa-prompt-dismissals', JSON.stringify(dismissals));
  };

  const dismissReminder = () => {
    setShowReminderBanner(false);
    const now = Date.now();
    const count = parseInt(localStorage.getItem('pwa-reminder-count') || '0') + 1;
    
    // Store dismissal data with progressive intervals
    localStorage.setItem('pwa-last-reminder', now.toString());
    localStorage.setItem('pwa-reminder-count', count.toString());
    
    // Track reminder dismissal patterns
    const dismissals = JSON.parse(localStorage.getItem('pwa-reminder-dismissals') || '[]');
    dismissals.push({ 
      timestamp: now, 
      count,
      userAgent: navigator.userAgent,
      isPWAMode: isPWAMode
    });
    
    // Keep only last 10 dismissals
    if (dismissals.length > 10) {
      dismissals.splice(0, dismissals.length - 10);
    }
    
    localStorage.setItem('pwa-reminder-dismissals', JSON.stringify(dismissals));
    
    // If user dismisses reminder frequently, reduce future frequency
    if (count >= 3) {
      localStorage.setItem('pwa-reminder-reduced', 'true');
    }
  };

  const install = async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        
        if (result.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          setShowInstallPrompt(false);
          setIsInstallable(false);
          return true;
        }
      } catch (error) {
        console.error('Installation failed:', error);
      }
    }
    return false;
  };

  const triggerInstallOnAction = (action: string) => {
    if (isInstalled || checkRecentlyDismissed()) return;
    
    const eng = loadEngagement();
    let shouldTrigger = false;
    
    switch (action) {
      case 'order-complete':
        shouldTrigger = true; // Always show after successful order
        break;
      case 'checkout':
        shouldTrigger = eng.pageViews >= 2 && eng.cartValue > 0;
        break;
      case 'cart':
        // Track cart abandonment risk
        saveEngagement({ ...eng, cartAbandoned: true });
        shouldTrigger = eng.cartValue > 50 || eng.productsViewed >= 3;
        break;
      case 'wishlist':
        shouldTrigger = eng.pageViews >= 3;
        break;
      case 'product-view':
        const newEng = { ...eng, productsViewed: eng.productsViewed + 1 };
        saveEngagement(newEng);
        shouldTrigger = newEng.productsViewed >= 5 && eng.timeSpent > 120000;
        break;
    }
    
    if (shouldTrigger) {
      setShowInstallPrompt(true);
    }
  };

  const checkOptimalTiming = () => {
    if (isInstalled || checkRecentlyDismissed()) return;
    const timing = calculateOptimalTiming();
    if (timing.shouldShow) {
      setShowInstallPrompt(true);
    }
  };

  const checkRecentlyDismissed = () => {
    const eng = loadEngagement();
    if (eng.installDismissed) {
      const hoursSince = (Date.now() - eng.installDismissed) / (1000 * 60 * 60);
      return hoursSince < 24; // Don't show for 24 hours after dismissal
    }
    return false;
  };

  const value: PWAContextType = {
    deferredPrompt,
    isInstallable,
    isInstalled,
    isPWAMode,
    isIOS,
    showInstallPrompt,
    showReminderBanner,
    promptInstall,
    dismissInstallPrompt,
    dismissReminder,
    install,
    triggerInstallOnAction,
    checkOptimalTiming
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

export function useEnhancedPWA(): PWAContextType {
  // Always returns a value – the default context provides safe no-ops when
  // the provider is missing or has crashed, preventing a cascade failure.
  return useContext(PWAContext);
}