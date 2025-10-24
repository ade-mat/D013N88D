import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

let initializedApp: admin.app.App | null = null;
let firestoreInstance: admin.firestore.Firestore | null = null;
let authInstance: admin.auth.Auth | null = null;
let initializationError: Error | null = null;

const decodeServiceAccount = (raw: string): admin.ServiceAccount | null => {
  const trimmed = raw.trim();
  const json = trimmed.startsWith('{')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf-8');
  try {
    return JSON.parse(json) as admin.ServiceAccount;
  } catch (error) {
    throw new Error('Unable to parse FIREBASE_SERVICE_ACCOUNT contents.');
  }
};

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const localServiceAccountPath = path.resolve(
  currentDir,
  '../../firebase-service-account.local.json'
);

const ensureServiceAccountEnv = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return;
  }

  try {
    const contents = fs.readFileSync(localServiceAccountPath, 'utf-8').trim();
    if (contents) {
      process.env.FIREBASE_SERVICE_ACCOUNT = contents;
    }
  } catch {
    // Missing file is fine; rely on other env configuration.
  }
};

const ensureInitialized = () => {
  if (initializedApp || initializationError) {
    return;
  }

  try {
    ensureServiceAccountEnv();
    if (admin.apps.length > 0) {
      initializedApp = admin.app();
    } else {
      const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
      const projectId = process.env.FIREBASE_PROJECT_ID;
      let serviceAccount: admin.ServiceAccount | null = null;
      if (serviceAccountEnv) {
        serviceAccount = decodeServiceAccount(serviceAccountEnv);
      }
      const credential = serviceAccount
        ? admin.credential.cert(serviceAccount)
        : admin.credential.applicationDefault();

      const resolvedProjectId =
        projectId ??
        (serviceAccount
          ? serviceAccount.projectId ??
            (serviceAccount as Record<string, string | undefined>).project_id
          : undefined);

      initializedApp = admin.initializeApp({
        credential,
        projectId: resolvedProjectId
      });
    }

    firestoreInstance = admin.firestore(initializedApp);
    authInstance = admin.auth(initializedApp);
  } catch (error) {
    initializationError = error instanceof Error ? error : new Error('Failed to initialize Firebase Admin SDK.');
    // eslint-disable-next-line no-console
    console.error(initializationError.message);
  }
};

export const getFirebaseApp = (): admin.app.App | null => {
  ensureInitialized();
  return initializedApp;
};

export const getFirestore = (): admin.firestore.Firestore | null => {
  ensureInitialized();
  return firestoreInstance;
};

export const getFirebaseAuth = (): admin.auth.Auth | null => {
  ensureInitialized();
  return authInstance;
};

export const isFirebaseAdminReady = (): boolean => {
  ensureInitialized();
  return Boolean(initializedApp && firestoreInstance && authInstance && !initializationError);
};

export const getFirebaseInitializationError = (): Error | null => {
  ensureInitialized();
  return initializationError;
};

export const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp();
