'use client';

/**
 * RouteAnalytics — fires a `page_view` event whenever the Next.js pathname changes.
 *
 * Mount inside ClientProvider (or layout) so it runs on every route.
 * Renders nothing visible — pure side-effect component.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics';

export default function RouteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    track({
      event: 'page_view',
      page_path: pathname,
      page_title: typeof document !== 'undefined' ? document.title : undefined,
    });
  }, [pathname]);

  return null;
}
