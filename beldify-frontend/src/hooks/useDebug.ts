import { useEffect, useRef } from 'react';
import debugUtils from '@/utils/debugUtils';

/**
 * Hook for debugging component performance and lifecycle
 * 
 * @param componentName Name of the component for logging
 * @param props Optional props to debug
 * @param dependencies Optional array of dependencies to track changes
 */
export function useDebug(
  componentName: string,
  props?: Record<string, any>,
  dependencies?: any[]
) {
  const renderCount = useRef(0);
  const mountTime = useRef(performance.now());
  
  // Log initial render
  useEffect(() => {
    if (!debugUtils.isDebugMode) return;

    debugUtils.logRender(`${componentName} mounted`);
    if (props) {
      debugUtils.debugObject(`${componentName} props`, props);
    }

    // Capture ref values at effect registration time so the cleanup closure
    // doesn't read a stale ref value after the component has unmounted.
    const capturedMountTime = mountTime.current;
    const capturedRenderCount = renderCount;
    return () => {
      if (!debugUtils.isDebugMode) return;
      const duration = performance.now() - capturedMountTime;
      debugUtils.logRender(`${componentName} unmounted after ${duration.toFixed(2)}ms (${capturedRenderCount.current} renders)`);
    };
  }, [componentName, props]);
  
  // Track re-renders
  useEffect(() => {
    if (!debugUtils.isDebugMode) return;
    renderCount.current++;
    
    if (renderCount.current > 1) {
      debugUtils.logRender(`${componentName} re-render #${renderCount.current}`);
    }
  });
  
  // Track dependency changes.
  // The dep array is intentionally dynamic (caller-supplied); ESLint cannot statically
  // verify it — that is the design of this debug utility hook.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!debugUtils.isDebugMode || !dependencies) return;
    if (renderCount.current > 1) {
      debugUtils.logRender(`${componentName} dependencies changed`);
    }
  }, dependencies || []);
  /* eslint-enable react-hooks/exhaustive-deps */
  
  // Return debug utilities for component-specific measurements
  return {
    startMeasure: (markName: string) => debugUtils.startMeasure(`${componentName}:${markName}`),
    endMeasure: (markName: string, threshold = 0) => debugUtils.endMeasure(`${componentName}:${markName}`, threshold),
    logEvent: (eventName: string, data?: any) => {
      if (!debugUtils.isDebugMode) return;
      if (data) {
        debugUtils.debugObject(`${componentName} ${eventName}`, data);
      } else {
        debugUtils.logRender(`${componentName} ${eventName}`);
      }
    }
  };
}

export default useDebug;