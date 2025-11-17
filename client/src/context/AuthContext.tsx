import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import type { PropsWithChildren } from 'react';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User
} from 'firebase/auth';
import { getFirebaseApp, isFirebaseConfigured } from '@/lib/firebase';

interface AuthUser {
  uid: string;
  email: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  initializing: boolean;
  authAvailable: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const app = getFirebaseApp();
  const auth = app ? getAuth(app) : null;
  const authAvailable = Boolean(auth);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(() => authAvailable);

  useEffect(() => {
    if (!auth) {
      setInitializing(false);
      if (!isFirebaseConfigured && import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('Firebase configuration missing; authentication disabled.');
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setFirebaseUser(nextUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, [auth]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!auth) {
        throw new Error('Authentication is not configured.');
      }
      await signInWithEmailAndPassword(auth, email, password);
    },
    [auth]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!auth) {
        throw new Error('Authentication is not configured.');
      }
      await createUserWithEmailAndPassword(auth, email, password);
    },
    [auth]
  );

  const sendPasswordReset = useCallback(
    async (email: string) => {
      if (!auth) {
        throw new Error('Authentication is not configured.');
      }
      await sendPasswordResetEmail(auth, email);
    },
    [auth]
  );

  const signOut = useCallback(async () => {
    if (!auth) {
      return;
    }
    await firebaseSignOut(auth);
  }, [auth]);

  const getIdToken = useCallback(
    async (forceRefresh?: boolean) => {
      if (!firebaseUser) {
        return null;
      }
      return firebaseUser.getIdToken(forceRefresh);
    },
    [firebaseUser]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: firebaseUser
        ? {
            uid: firebaseUser.uid,
            email: firebaseUser.email
          }
        : null,
      initializing,
      authAvailable,
      signIn,
      signUp,
      sendPasswordReset,
      signOut,
      getIdToken
    }),
    [authAvailable, firebaseUser, getIdToken, initializing, signIn, signOut, signUp, sendPasswordReset]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
