'use client';

import { ReactNode, createContext, useContext, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface NavigationContextType {
  navigateTo: (path: string) => void;
  isPending: boolean;
}

// Create context with default values
const NavigationContext = createContext<NavigationContextType>({
  navigateTo: () => {},
  isPending: false
});

// Custom hook to enhance Next.js router performance without breaking state persistence
export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const pendingRef = useRef(false);
  
  // Custom navigation function that prevents the delay without breaking state
  const navigateTo = (path: string) => {
    // Visual feedback only
    document.body.style.cursor = 'wait';
    pendingRef.current = true;

    // Use standard Next.js router
    router.push(path);
  };

  // Apply optimizations on mount
  useEffect(() => {
    // Prefetch all links in viewport for faster navigation (defined inline to
    // avoid a stale-closure dep on the outer `router` reference).
    const prefetchVisibleLinks = () => {
      if (typeof window === 'undefined' || !window.IntersectionObserver) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('http')) {
              router.prefetch(href);
            }
            // Unobserve after prefetching
            observer.unobserve(link);
          }
        });
      });

      // Observe all links in the viewport
      const timerId = setTimeout(() => {
        document.querySelectorAll('a[href]').forEach(link => {
          observer.observe(link);
        });
      }, 1000);
      return timerId;
    };

    // Prefetch links for faster navigation
    const prefetchTimerId = prefetchVisibleLinks();

    // Clear cursor and pending state on route change
    const handleRouteChange = () => {
      document.body.style.cursor = '';
      pendingRef.current = false;
    };

    // Reset on page load
    handleRouteChange();

    // Setup global CSS to improve perceived performance
    const style = document.createElement('style');
    style.innerHTML = `
      a, button {
        transition: opacity 0.1s ease-out !important;
      }
      a:active, button:active {
        opacity: 0.7 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (prefetchTimerId) clearTimeout(prefetchTimerId);
      document.head.removeChild(style);
    };
  }, [router]);
  
  return (
    <NavigationContext.Provider value={{ navigateTo, isPending: pendingRef.current }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
