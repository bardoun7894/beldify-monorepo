import { toast as hotToast } from 'react-hot-toast';
import { isDebuggingEnabled } from './debugMode';

// Get the correct type for toast options
type ToastOptions = Parameters<typeof hotToast>[1];

// User-facing toasts (success/error/loading/custom) always render — they are core
// purchase-flow feedback (add-to-cart, checkout, wishlist). Only `debug` is gated.
const toast = {
  success: (message: string, options?: ToastOptions) => hotToast.success(message, options),

  error: (message: string, options?: ToastOptions) => hotToast.error(message, options),

  loading: (message: string, options?: ToastOptions) => hotToast.loading(message, options),

  custom: (renderer: any, options?: any) => hotToast.custom(renderer, options),
  
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