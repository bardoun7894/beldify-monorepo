import logger from './consoleLogger';

/**
 * Request notification permission from the user
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      logger.log('Notification permission granted.');
      return true;
    } else {
      logger.log('Notification permission denied.');
      return false;
    }
  } else {
    logger.log('This browser does not support notifications.');
    return false;
  }
};

/**
 * Check if notifications are supported and enabled
 */
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission | null => {
  if ('Notification' in window) {
    return Notification.permission;
  }
  return null;
};