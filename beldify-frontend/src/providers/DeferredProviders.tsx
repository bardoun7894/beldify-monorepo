'use client';

import { ReactNode, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import heavy providers - they load after initial render
const MessagingProvider = dynamic(
  () => import('@/contexts/MessagingContext').then((mod) => mod.MessagingProvider),
  { ssr: false }
);

const RealtimeChatProvider = dynamic(
  () => import('@/contexts/RealtimeChatContext').then((mod) => mod.RealtimeChatProvider),
  { ssr: false }
);

interface DeferredProvidersProps {
  children: ReactNode;
}

/**
 * Wraps children with heavy providers that are loaded after the initial render.
 * This reduces the initial bundle size and prevents chunk loading timeouts.
 */
export default function DeferredProviders({ children }: DeferredProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer loading of heavy providers until after initial paint
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    // Return children without heavy providers during initial load
    return <>{children}</>;
  }

  return (
    <MessagingProvider>
      <RealtimeChatProvider>
        {children}
      </RealtimeChatProvider>
    </MessagingProvider>
  );
}
