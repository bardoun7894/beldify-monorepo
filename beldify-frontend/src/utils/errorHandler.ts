import toast from './toast';
import { isDebuggingEnabled } from './debugMode';
import logger from './consoleLogger';

interface ErrorOptions {
  debug?: boolean;
  suggestion?: string;
}

export const handleError = (error: any, options: ErrorOptions = {}) => {
  const isDebug = options.debug || false;

  // Get the error message
  const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
  
  if (isDebug && isDebuggingEnabled()) {
    // In debug mode and debugging is enabled, show technical details
    logger.error('Debug Error:', error);
    toast.debug(`Debug Error: ${errorMessage}`);
    return;
  }

  // In production or when debug is disabled, show user-friendly messages
  const friendlyMessages: Record<string, { title: string; message: string }> = {
    'insufficient_stock': {
      title: 'Item Unavailable',
      message: 'This item is currently out of stock or the requested quantity exceeds our available stock.'
    },
    'invalid_quantity': {
      title: 'Invalid Quantity',
      message: 'Please select a valid quantity for this item.'
    },
    'auth_required': {
      title: 'Sign in Required',
      message: 'Please sign in to continue with your purchase.'
    },
    'default': {
      title: 'Something went wrong',
      message: 'We encountered an issue while processing your request.'
    }
  };

  // Get the appropriate message based on the error type
  const errorType = error.response?.data?.type || 'default';
  const { title, message } = friendlyMessages[errorType] || friendlyMessages.default;

  // Return the error details for custom UI rendering
  return {
    title,
    message,
    suggestion: options.suggestion,
    errorType
  };
};
