import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// True once real project config has been dropped into .env. Until then we
// deliberately avoid calling getAuth()/getFirestore() — with a missing or
// placeholder apiKey they throw synchronously at module-load time, which
// would crash the entire app (including screens that don't need auth) with
// nothing shown but a blank error page. Instead the app renders normally,
// and auth-dependent calls fail with one clear message telling you to finish
// the setup, from AuthContext's own functions.
export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app = firebaseReady
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

// Web already persists to localStorage by default via getAuth(). Native needs
// to be told explicitly to persist through AsyncStorage, or every app restart
// signs the user out.
export const auth = firebaseReady
  ? Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : null;

export const db = firebaseReady ? getFirestore(app) : null;
