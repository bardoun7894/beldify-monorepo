'use client';

import { useEffect } from 'react';

interface PerformanceMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }

    const metrics: PerformanceMetrics = {};

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        switch (entry.name) {
          case 'first-contentful-paint':
            metrics.FCP = entry.startTime;
            break;
          case 'largest-contentful-paint':
            metrics.LCP = entry.startTime;
            break;
          case 'first-input':
            metrics.FID = (entry as any).processingStart - entry.startTime;
            break;
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              metrics.CLS = (metrics.CLS || 0) + (entry as any).value;
            }
            break;
        }
      });
    });

    // Observe paint and layout-shift entries
    if ('observe' in observer) {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    }

    // Monitor navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.TTFB = navigation.responseStart - navigation.requestStart;
    }

    // Log metrics after page load
    const timeout = setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.group('🚀 Performance Metrics');
        console.log('First Contentful Paint (FCP):', metrics.FCP ? `${metrics.FCP.toFixed(2)}ms` : 'Not measured');
        console.log('Largest Contentful Paint (LCP):', metrics.LCP ? `${metrics.LCP.toFixed(2)}ms` : 'Not measured');
        console.log('First Input Delay (FID):', metrics.FID ? `${metrics.FID.toFixed(2)}ms` : 'Not measured');
        console.log('Cumulative Layout Shift (CLS):', metrics.CLS ? metrics.CLS.toFixed(4) : 'Not measured');
        console.log('Time to First Byte (TTFB):', metrics.TTFB ? `${metrics.TTFB.toFixed(2)}ms` : 'Not measured');
        console.groupEnd();

        // Performance recommendations
        const recommendations: string[] = [];
        if (metrics.FCP && metrics.FCP > 1800) recommendations.push('Consider optimizing First Contentful Paint');
        if (metrics.LCP && metrics.LCP > 2500) recommendations.push('Consider optimizing Largest Contentful Paint');
        if (metrics.FID && metrics.FID > 100) recommendations.push('Consider optimizing First Input Delay');
        if (metrics.CLS && metrics.CLS > 0.1) recommendations.push('Consider reducing Cumulative Layout Shift');

        if (recommendations.length > 0) {
          console.group('⚡ Performance Recommendations');
          recommendations.forEach(rec => console.warn(rec));
          console.groupEnd();
        }
      }

      // Send to analytics in production
      if (process.env.NODE_ENV === 'production') {
        // Send metrics to your analytics service
        sendMetricsToAnalytics(metrics);
      }
    }, 3000);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);
}

// Analytics function — forwards Core Web Vitals to GTM dataLayer and gtag.
// Integrated with the analytics event layer: pushes directly to window.dataLayer
// (always available once AnalyticsScripts mounts) and forwards via gtag if loaded.
function sendMetricsToAnalytics(metrics: PerformanceMetrics) {
  if (typeof window === 'undefined') return;

  const win = window as Window & {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  };

  // Push to GTM dataLayer (picked up by any GTM tag that listens for 'web_vitals')
  win.dataLayer = win.dataLayer || [];
  win.dataLayer.push({
    event: 'web_vitals',
    metric_fcp: metrics.FCP,
    metric_lcp: metrics.LCP,
    metric_fid: metrics.FID,
    metric_cls: metrics.CLS,
    metric_ttfb: metrics.TTFB,
  });

  // Also forward via gtag when GA4 is directly loaded (no GTM)
  if (typeof win.gtag === 'function') {
    win.gtag('event', 'web_vitals', {
      metric_fcp: metrics.FCP,
      metric_lcp: metrics.LCP,
      metric_fid: metrics.FID,
      metric_cls: metrics.CLS,
      metric_ttfb: metrics.TTFB,
    });
  }
}

// Component to wrap pages for automatic monitoring
export default function PerformanceMonitor({ children }: { children: React.ReactNode }) {
  usePerformanceMonitor();
  return <>{children}</>;
}

// Resource monitoring utilities
export function logResourceTiming() {
  if (typeof window === 'undefined' || !window.performance) return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const slowResources = resources.filter(resource => resource.duration > 1000);
  
  if (slowResources.length > 0 && process.env.NODE_ENV === 'development') {
    console.group('🐌 Slow Loading Resources');
    slowResources.forEach(resource => {
      console.warn(`${resource.name}: ${resource.duration.toFixed(2)}ms`);
    });
    console.groupEnd();
  }
}

// Memory monitoring
export function logMemoryUsage() {
  if (typeof window === 'undefined' || !(performance as any).memory) return;

  const memory = (performance as any).memory;
  if (process.env.NODE_ENV === 'development') {
    console.group('💾 Memory Usage');
    console.log(`Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
    console.groupEnd();
  }
}

// Bundle size analyzer (client-side)
export function analyzeBundleSize() {
  if (typeof window === 'undefined') return;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

  Promise.all([
    ...scripts.map(async (script) => {
      const src = (script as HTMLScriptElement).src;
      try {
        const response = await fetch(src, { method: 'HEAD' });
        const size = response.headers.get('content-length');
        return { type: 'script', url: src, size: size ? parseInt(size) : 0 };
      } catch {
        return { type: 'script', url: src, size: 0 };
      }
    }),
    ...styles.map(async (link) => {
      const href = (link as HTMLLinkElement).href;
      try {
        const response = await fetch(href, { method: 'HEAD' });
        const size = response.headers.get('content-length');
        return { type: 'style', url: href, size: size ? parseInt(size) : 0 };
      } catch {
        return { type: 'style', url: href, size: 0 };
      }
    })
  ]).then(assets => {
    const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
    const largeAssets = assets.filter(asset => asset.size > 100000); // > 100KB

    if (process.env.NODE_ENV === 'development') {
      console.group('📦 Bundle Analysis');
      console.log(`Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      
      if (largeAssets.length > 0) {
        console.group('⚠️ Large Assets (>100KB)');
        largeAssets.forEach(asset => {
          console.log(`${asset.type}: ${(asset.size / 1024).toFixed(2)}KB - ${asset.url}`);
        });
        console.groupEnd();
      }
      console.groupEnd();
    }
  });
}