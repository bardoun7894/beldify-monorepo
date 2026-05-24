// Utility to determine if debugging should be enabled

/**
 * Determines whether debug logging is enabled.
 *
 * Behavior:
 * - Always disabled in production builds or on production domains.
 * - In non-production, it's DISABLED by default and must be explicitly enabled via:
 *   - Env var NEXT_PUBLIC_DEBUG_MODE=true
 *   - localStorage DEBUG=1|true or sessionStorage DEBUG=1|true
 *   - URL parameter ?debug=1|true
 */
export const isDebuggingEnabled = (): boolean => {
  // Hard-disable on production builds
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return false;
  }

  // Also disable on production domains (client-side check)
  if (typeof window !== 'undefined') {
    const host = window.location?.hostname;
    if (host === 'www.beldify.com' || host === 'beldify.com') {
      return false;
    }
    
    // Check URL parameter for temporary debug enabling
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    if (debugParam === '1' || debugParam === 'true') {
      return true;
    }
  }

  // Explicit environment flag takes precedence when not production
  if (typeof process !== 'undefined') {
    if (typeof process.env?.NEXT_PUBLIC_DEBUG_MODE !== 'undefined') {
      return process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
    }
    if (typeof process.env?.NEXT_PUBLIC_DEBUG !== 'undefined') {
      return process.env.NEXT_PUBLIC_DEBUG === 'true';
    }
  }

  // Check localStorage and sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const localDebug = window.localStorage?.getItem('DEBUG');
      if (localDebug === '1' || localDebug === 'true') {
        return true;
      }

      const sessionDebug = window.sessionStorage?.getItem('DEBUG');
      if (sessionDebug === '1' || sessionDebug === 'true') {
        return true;
      }
    } catch (e) {
      // Ignore storage access errors
    }
  }

  // Default to disabled
  return false;
};

/**
 * Get the current debug level (0-3)
 * 0 = disabled
 * 1 = minimal
 * 2 = normal
 * 3 = verbose
 */
export const getDebugLevel = (): number => {
  if (!isDebuggingEnabled()) {
    return 0;
  }
  
  // Check for level in environment
  if (typeof process !== 'undefined' && typeof process.env?.NEXT_PUBLIC_DEBUG_LEVEL !== 'undefined') {
    const level = parseInt(process.env.NEXT_PUBLIC_DEBUG_LEVEL, 10);
    if (!isNaN(level) && level >= 0 && level <= 3) {
      return level;
    }
  }
  
  // Check for level in URL
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const levelParam = urlParams.get('debug_level');
    if (levelParam) {
      const level = parseInt(levelParam, 10);
      if (!isNaN(level) && level >= 0 && level <= 3) {
        return level;
      }
    }
  }
  
  // Default to normal debugging
  return 2;
};

const debugMode = {
  isDebuggingEnabled,
  getDebugLevel
};

export default debugMode;