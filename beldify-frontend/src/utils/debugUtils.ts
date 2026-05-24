/**
 * Debug utilities for development mode
 */

import logger from './consoleLogger';

// Check if debug mode is enabled via environment variable
export const isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';

// Performance measurement utilities
const perfMarks: Record<string, number> = {};

/**
 * Start measuring performance for a named operation
 * @param markName Name of the performance mark
 */
export function startMeasure(markName: string): void {
  if (!isDebugMode) return;
  perfMarks[markName] = performance.now();
}

/**
 * End measuring performance and log the result
 * @param markName Name of the performance mark
 * @param logThreshold Only log if duration exceeds this threshold (ms)
 */
export function endMeasure(markName: string, logThreshold = 0): void {
  if (!isDebugMode || !perfMarks[markName]) return;
  
  const duration = performance.now() - perfMarks[markName];
  delete perfMarks[markName];
  
  if (duration > logThreshold) {
    logger.debug(`⏱️ ${markName}: ${duration.toFixed(2)}ms`);
  }
}

/**
 * Log component render for performance tracking
 * @param componentName Name of the component
 */
export function logRender(componentName: string): void {
  if (!isDebugMode) return;
  logger.debug(`🔄 Rendering: ${componentName}`);
}

/**
 * Log API calls for debugging
 * @param endpoint API endpoint
 * @param method HTTP method
 * @param duration Duration in ms
 */
export function logApiCall(endpoint: string, method: string, duration: number): void {
  if (!isDebugMode) return;
  logger.debug(`🌐 API ${method} ${endpoint}: ${duration.toFixed(2)}ms`);
}

/**
 * Create a wrapped fetch function that logs performance
 */
export function createDebugFetch(): typeof fetch {
  return function debugFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (!isDebugMode) return fetch(input, init);
    
    const url = typeof input === 'string' ? input : input.url;
    const method = init?.method || 'GET';
    const start = performance.now();
    
    return fetch(input, init).then(response => {
      const duration = performance.now() - start;
      logApiCall(url, method, duration);
      return response;
    }).catch(error => {
      const duration = performance.now() - start;
      logger.error(`🌐 API ${method} ${url} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    });
  };
}

// Export a debug-enabled fetch function
export const debugFetch = createDebugFetch();

/**
 * Log memory usage
 */
export function logMemoryUsage(): void {
  if (!isDebugMode || typeof window === 'undefined') return;
  
  if (performance && performance.memory) {
    const memory = (performance as any).memory;
    logger.debug(`📊 Memory: ${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB / ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)}MB`);
  }
}

/**
 * Debug object - logs object properties if debug mode is enabled
 */
export function debugObject(label: string, obj: any): void {
  if (!isDebugMode) return;
  logger.debug(`🔍 ${label}:`, obj);
}

const debugUtils = {
  isDebugMode,
  startMeasure,
  endMeasure,
  logRender,
  logApiCall,
  debugFetch,
  logMemoryUsage,
  debugObject
};

export default debugUtils;