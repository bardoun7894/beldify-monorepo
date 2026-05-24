import { isDebuggingEnabled, getDebugLevel } from './debugMode';

/**
 * Enhanced console logger with debug levels
 * 
 * Debug levels:
 * 0 = disabled (no logs)
 * 1 = minimal (errors only)
 * 2 = normal (errors, warnings, important info)
 * 3 = verbose (all logs including debug)
 */
const logger = {
  /**
   * Standard log - only shown at debug level 3 (verbose)
   */
  log: (...args: any[]) => {
    if (isDebuggingEnabled() && getDebugLevel() >= 3) {
      console.log(...args);
    }
  },
  
  /**
   * Error log - shown at all debug levels except 0
   */
  error: (...args: any[]) => {
    if (isDebuggingEnabled() && getDebugLevel() >= 1) {
      console.error(...args);
    }
  },
  
  /**
   * Warning log - shown at debug levels 2 and 3
   */
  warn: (...args: any[]) => {
    if (isDebuggingEnabled() && getDebugLevel() >= 2) {
      console.warn(...args);
    }
  },
  
  /**
   * Info log - shown at debug levels 2 and 3
   */
  info: (...args: any[]) => {
    if (isDebuggingEnabled() && getDebugLevel() >= 2) {
      console.info(...args);
    }
  },
  
  /**
   * Debug log - only shown at debug level 3 (verbose)
   */
  debug: (...args: any[]) => {
    if (isDebuggingEnabled() && getDebugLevel() >= 3) {
      console.debug(...args);
    }
  },
  
  /**
   * Performance log - shown at debug levels 2 and 3
   */
  perf: (...args: any[]) => {
    if (isDebuggingEnabled() && getDebugLevel() >= 2) {
      console.log('⏱️', ...args);
    }
  },
  
  // These methods will always work regardless of debug mode
  always: {
    log: (...args: any[]) => console.log(...args),
    error: (...args: any[]) => console.error(...args),
    warn: (...args: any[]) => console.warn(...args),
    info: (...args: any[]) => console.info(...args),
    debug: (...args: any[]) => console.debug(...args),
  },
  
  /**
   * Get current debug status
   */
  status: () => ({
    enabled: isDebuggingEnabled(),
    level: getDebugLevel(),
    levelName: ['disabled', 'minimal', 'normal', 'verbose'][getDebugLevel()]
  })
};

export default logger;