import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  onAuthStateChanged,
  updateProfile as updateAuthProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, firebaseReady } from '../firebase/config';

const AuthContext = createContext(null);

const NOT_CONFIGURED_MESSAGE =
  'Firebase isn\'t configured yet — copy .env.example to .env, fill in your Firebase project\'s web app config, and restart the app.';

function assertReady() {
  if (!firebaseReady) {
    throw new Error(NOT_CONFIGURED_MESSAGE);
  }
}

function mapAuthError(error) {
  switch (error?.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect password.';
    default:
      return error?.message || 'Something went wrong.';
  }
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD PROFILE (Firestore users/{uid}, merged with the Auth record)
  // =========================

  const loadProfile = async (firebaseUser) => {
    const ref = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(ref);
    const profile = snap.exists() ? snap.data() : {};

    const merged = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      provider: 'local',
      role: null,
      photo: null,
      ...profile,
      name: profile.name || firebaseUser.displayName || '',
    };

    setUserState(merged);
    return merged;
  };

  // =========================
  // RESTORE SESSION (Firebase persists this itself; we just react to it)
  // =========================

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await loadProfile(firebaseUser);
        } else {
          setUserState(null);
        }
      } catch (error) {
        console.log('Auth state load error:', error);
        setUserState(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // =========================
  // TOKEN
  // =========================

  const getToken = async () => {
    if (!firebaseReady || !auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  // =========================
  // SET USER
  // (kept for API compatibility — real state now comes from onAuthStateChanged)
  // =========================

  const setUser = async (profile) => {
    setUserState(profile);
    return profile;
  };

  // =========================
  // REGISTER
  // =========================

  const register = async (name, email, password) => {
    assertReady();

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateAuthProfile(cred.user, { displayName: name.trim() });

      await setDoc(doc(db, 'users', cred.user.uid), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: null,
        photo: null,
        provider: 'local',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return await loadProfile(cred.user);
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  };

  // =========================
  // LOGIN
  // =========================

  const login = async (email, password) => {
    assertReady();

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      return await loadProfile(cred.user);
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  };

  // =========================
  // GOOGLE LOGIN
  // Expects { idToken } from expo-auth-session's useIdTokenAuthRequest.
  // =========================

  const googleLogin = async ({ idToken }) => {
    assertReady();

    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);

      const ref = doc(db, 'users', result.user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          name: result.user.displayName || '',
          email: (result.user.email || '').toLowerCase(),
          role: null,
          photo: result.user.photoURL || null,
          provider: 'google',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      return await loadProfile(result.user);
    } catch (error) {
      throw new Error(mapAuthError(error));
    }
  };

  // =========================
  // COMPLETE PROFILE
  // =========================

  const completeProfile = async (role, fullName) => {
    assertReady();

    if (!auth.currentUser) {
      throw new Error('You are not logged in');
    }

    const ref = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(ref, { role, name: fullName, updatedAt: serverTimestamp() });

    return await loadProfile(auth.currentUser);
  };

  // =========================
  // UPDATE PROFILE DETAILS
  // =========================

  const updateProfileDetails = async (profileData) => {
    assertReady();

    if (!auth.currentUser) {
      throw new Error('You are not logged in');
    }

    const ref = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(ref, { ...profileData, updatedAt: serverTimestamp() });

    return await loadProfile(auth.currentUser);
  };

  // =========================
  // SIGN OUT
  // =========================

  const signOut = async () => {
    if (!firebaseReady) {
      setUserState(null);
      return;
    }

    try {
      await firebaseSignOut(auth);
      setUserState(null);
    } catch (error) {
      console.log('SIGN OUT ERROR:', error);
    }
  };

  // =========================
  // CONTEXT VALUE
  // =========================

  const value = {
    user,
    loading,

    register,
    login,
    googleLogin,

    setUser,
    completeProfile,
    updateProfileDetails,

    signOut,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =========================
// HOOK
// =========================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}

export default AuthContext;
