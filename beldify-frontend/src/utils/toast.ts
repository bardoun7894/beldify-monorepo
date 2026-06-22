import { toast as hotToast } from 'react-hot-toast';
import { isDebuggingEnabled } from './debugMode';

// Get the correct type for toast options
type ToastOptions = Parameters<typeof hotToast>[1];

// User-facing toast wrapper. Standard variants are always shown — they convey
// real outcomes (cart updates, login errors, etc.) and gating them on debug
// mode silenced all production user feedback.
const toast = {
  success: (message: string, options?: ToastOptions) => hotToast.success(message, options),

  error: (message: string, options?: ToastOptions) => hotToast.error(message, options),

  loading: (message: string, options?: ToastOptions) => hotToast.loading(message, options),

  custom: (renderer: any, options?: any) => hotToast.custom(renderer, options),

  dismiss: hotToast.dismiss,

  // Debug toasts remain gated — only visible when debug mode is explicitly on.
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
    return null;
  }
};

export default toast;
