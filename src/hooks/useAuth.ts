import { useCallback, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  sendEmailVerification,
  User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

type UseAuthResult = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (e) {
        // ignore persistence failure, continue with default
      }

      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      }, (err) => {
        setError(err?.message || 'Auth error');
        setLoading(false);
      });
    })();

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result.user && !result.user.emailVerified && result.user.email) {
        try {
          await sendEmailVerification(result.user);
        } catch {
          // best-effort
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to sign in';
      setError(message);
      throw e;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setError(null);
    try {
      await auth.signOut();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to sign out';
      setError(message);
      throw e;
    }
  }, []);

  return { user, loading, error, signIn, signOutUser };
}


