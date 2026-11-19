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

const NOT_CONFIGURED_MESSAGE =
  'Firebase isn\'t configured yet — copy .env.example to .env, fill in your Firebase project\'s web app config, and restart the app.';

function assertReady() {
  if (!firebaseReady) {
    throw new Error(NOT_CONFIGURED_MESSAGE);
  }
}

function logAuthError(label, error) {
  console.error(`[firebaseProvider] ${label}`, {
    code: error?.code,
    message: error?.message,
    customData: error?.customData,
    name: error?.name,
    stack: error?.stack,
  });
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
      return 'Incorrect password.';
    case 'auth/invalid-credential':
      // Firebase uses this code both for rejected Google ID tokens and for
      // bad email/password combos, so surface the real code and message.
      return `Sign-in failed (${error.code}): ${error?.message || 'no details'}`;
    default:
      return error?.code
        ? `${error?.message || 'Something went wrong.'} (${error.code})`
        : error?.message || 'Something went wrong.';
  }
}

// =========================
// LOAD PROFILE (Firestore users/{uid}, merged with the Auth record)
// =========================

async function loadProfile(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);
  const profile = snap.exists() ? snap.data() : {};

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    provider: 'local',
    role: null,
    photo: null,
    ...profile,
    name: profile.name || firebaseUser.displayName || '',
  };
}

// =========================
// SUBSCRIBE (Firebase persists sessions itself; we just react to it)
// =========================

function subscribe(callback) {
  if (!firebaseReady) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (firebaseUser) {
        callback(await loadProfile(firebaseUser));
      } else {
        callback(null);
      }
    } catch (error) {
      console.log('Auth state load error:', error);
      callback(null);
    }
  });
}

// =========================
// TOKEN
// =========================

async function getToken() {
  if (!firebaseReady || !auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

// =========================
// REGISTER
// =========================

async function register(name, email, password) {
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
    logAuthError('register failed', error);
    throw new Error(mapAuthError(error));
  }
}

// =========================
// LOGIN
// =========================

async function login(email, password) {
  assertReady();

  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return await loadProfile(cred.user);
  } catch (error) {
    logAuthError('login failed', error);
    throw new Error(mapAuthError(error));
  }
}

// =========================
// GOOGLE LOGIN
// Expects { idToken } from expo-auth-session's useIdTokenAuthRequest.
// =========================

async function googleLogin({ idToken }) {
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
    logAuthError('googleLogin failed', error);
    throw new Error(mapAuthError(error));
  }
}

// =========================
// COMPLETE PROFILE
// =========================

async function completeProfile(role, fullName) {
  assertReady();

  if (!auth.currentUser) {
    throw new Error('You are not logged in');
  }

  const ref = doc(db, 'users', auth.currentUser.uid);
  await updateDoc(ref, { role, name: fullName, updatedAt: serverTimestamp() });

  return await loadProfile(auth.currentUser);
}

// =========================
// UPDATE PROFILE DETAILS
// =========================

async function updateProfileDetails(profileData) {
  assertReady();

  if (!auth.currentUser) {
    throw new Error('You are not logged in');
  }

  const ref = doc(db, 'users', auth.currentUser.uid);
  await updateDoc(ref, { ...profileData, updatedAt: serverTimestamp() });

  return await loadProfile(auth.currentUser);
}

// =========================
// SIGN OUT
// =========================

async function signOut() {
  if (!firebaseReady) return;

  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.log('SIGN OUT ERROR:', error);
  }
}

const firebaseProvider = {
  ready: firebaseReady,
  subscribe,
  register,
  login,
  googleLogin,
  completeProfile,
  updateProfileDetails,
  signOut,
  getToken,
};

export default firebaseProvider;
