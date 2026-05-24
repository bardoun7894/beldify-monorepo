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
    
    return () => {
      if (!debugUtils.isDebugMode) return;
      const duration = performance.now() - mountTime.current;
      debugUtils.logRender(`${componentName} unmounted after ${duration.toFixed(2)}ms (${renderCount.current} renders)`);
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
  
  // Track dependency changes
  useEffect(() => {
    if (!debugUtils.isDebugMode || !dependencies) return;
    if (renderCount.current > 1) {
      debugUtils.logRender(`${componentName} dependencies changed`);
    }
  }, dependencies || []);
  
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