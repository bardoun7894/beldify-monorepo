'use client';

import React, { memo, ReactNode, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OptimizedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  prefetch?: boolean;
  [key: string]: any;
}

/**
 * OptimizedLink component that improves navigation performance
 * - Automatically prefetches links
 * - Uses memo to prevent unnecessary re-renders
 * - Adds preconnect for cross-origin links
 * - Implements navigation prediction
 */
function OptimizedLinkComponent({
  href,
  children,
  className,
  onClick,
  prefetch = true,
  ...props
}: OptimizedLinkProps) {
  const router = useRouter();
  
  // Preload content on hover for better perceived performance
  const handleMouseEnter = useCallback(() => {
    router.prefetch(href);
  }, [href, router]);
  
  // Add preconnect for external links
  useEffect(() => {
    if (href.startsWith('http') && typeof window !== 'undefined') {
      try {
        const url = new URL(href);
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = `${url.protocol}//${url.hostname}`;
        document.head.appendChild(link);
        
        return () => {
          document.head.removeChild(link);
        };
      } catch (e) {
        // Ignore URL parsing errors
      }
    }
  }, [href]);
  
  // Handle click with performance tracking
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Track navigation start time for performance monitoring
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark('navigation-start');
    }
    
    if (onClick) {
      onClick(e);
    }
  }, [onClick]);
  
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  );
}

// Use memo to prevent unnecessary re-renders
const OptimizedLink = memo(OptimizedLinkComponent);

export default OptimizedLink;
