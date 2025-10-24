import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const requiredKeys: Array<keyof typeof firebaseConfig> = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId'
];

const hasRequiredConfig = requiredKeys.every((key) => Boolean(firebaseConfig[key]));

let firebaseApp: FirebaseApp | null = null;

export const isFirebaseConfigured = hasRequiredConfig;

export const getFirebaseApp = (): FirebaseApp | null => {
  if (!hasRequiredConfig) {
    return null;
  }

  if (firebaseApp) {
    return firebaseApp;
  }

  const existing = getApps();
  firebaseApp = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig);
  return firebaseApp;
};
