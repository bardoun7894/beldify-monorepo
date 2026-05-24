import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getMessaging, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Only initialize if we have required config and are in a secure context (or localhost).
// Browsers disable ServiceWorkers on insecure HTTP, which causes Firebase Messaging to fail.
let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Whether Firebase Messaging was intentionally disabled (insecure context,
 * missing config, unsupported environment). Consumers should check this to
 * distinguish "not yet initialized" from "permanently unavailable".
 */
let messagingDisabledReason: string | null = null;

if (typeof window !== 'undefined') {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    messagingDisabledReason = 'Missing required Firebase configuration (apiKey or projectId).';
    // Intentionally silent — consumers can read `messagingDisabledReason` if they need to surface it.
  } else {
    // Check for secure context (HTTPS or localhost)
    const isSecure = window.isSecureContext ?? (
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );

    if (!isSecure) {
      messagingDisabledReason = 'Application is running in an insecure context (HTTP). HTTPS is required for push notifications.';
      console.warn(`Firebase disabled: ${messagingDisabledReason}`);
    } else {
      try {
        // Check if already initialized
        app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

        // Initialize Messaging only if all required browser APIs are available
        const isMessagingSupported =
          'navigator' in window &&
          'serviceWorker' in navigator &&
          'PushManager' in window &&
          'Notification' in window;

        if (isMessagingSupported) {
          messaging = getMessaging(app);
        } else {
          messagingDisabledReason = 'Browser missing required APIs (ServiceWorker, PushManager, or Notification).';
          console.warn(`Firebase Messaging unavailable: ${messagingDisabledReason}`);
        }
      } catch (error) {
        messagingDisabledReason = `Initialization failed: ${error instanceof Error ? error.message : String(error)}`;
        console.warn('Firebase initialization failed:', error);
        // Ensure nothing is partially initialized
        app = null;
        messaging = null;
      }
    }
  }
}

export { app, messaging, messagingDisabledReason };
