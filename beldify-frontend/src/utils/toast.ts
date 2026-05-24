import { toast as hotToast } from 'react-hot-toast';
import { isDebuggingEnabled } from './debugMode';

// Get the correct type for toast options
type ToastOptions = Parameters<typeof hotToast>[1];

// Create a wrapper for toast that respects debugging settings
const toast = {
  // Standard toasts are only shown when debugging is enabled
  success: (message: string, options?: ToastOptions) => {
    if (isDebuggingEnabled()) {
      return hotToast.success(message, options);
    }
    return null;
  },
  
  error: (message: string, options?: ToastOptions) => {
    if (isDebuggingEnabled()) {
      return hotToast.error(message, options);
    }
    return null;
  },
  
  loading: (message: string, options?: ToastOptions) => {
    if (isDebuggingEnabled()) {
      return hotToast.loading(message, options);
    }
    return null;
  },
  
  // Custom toasts should also respect debug mode
  custom: (renderer: any, options?: any) => {
    if (isDebuggingEnabled()) {
      return hotToast.custom(renderer, options);
    }
    return null;
  },
  
  // Dismiss should always be allowed to clear any existing toasts
  dismiss: hotToast.dismiss,
  
  // Debug toasts are only shown in debug mode (with a distinct style)
  debug: (message: string, options?: ToastOptions) => {
    if (isDebuggingEnabled()) {
      return hotToast(message, Object.assign({
        icon: '🐞',
        style: {
          background: '#333',
          color: '#fff',
          border: '1px solid #666',
        }
      }, options || {}));
    }
    return null; // Return null when debugging is disabled
  }
};

export default toast;