import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { brandKitSyncEnabled, loadRemoteBrandKit, saveRemoteBrandKit } from '../firebase/brandKitStore';

// The Brand Kit is saved on this device (AsyncStorage — localStorage on web)
// and, with Firebase, in the account's users/{uid} document (see
// src/firebase/brandKitStore.js), separately for each signed-in account, so
// it follows the account to other browsers, survives reloads and the
// Create screen can use the logo, organisation details, contact info and
// reference posts. Images are stored as data: URIs because web picker URIs
// (blob:) die with the page.

const STORAGE_KEY = 'sociallift.brandKit.v1';

const storageKeyFor = (uid) => (uid ? `${STORAGE_KEY}:${uid}` : STORAGE_KEY);

export const EMPTY_BRAND_KIT = {
  logoMode: 'upload', // upload | text
  logoUri: null,
  logoSize: null,
  brandText: '',
  orgName: '',
  orgLocation: '',
  badgesUri: null,
  badgesSize: null,
  colorIndex: 0,
  customHex: '',
  toneIndex: 0,
  isCustomTone: false,
  customTone: '',
  contactPhone: '',
  website: '',
  department: '',
  // Reference posts this account wants its posts to look like — see
  // src/ai/postTypes.js (buildPostTypes) for the shape of each entry.
  references: [],
};

const BrandKitContext = createContext(null);

export function BrandKitProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid || null;

  const [brandKit, setBrandKit] = useState(EMPTY_BRAND_KIT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    setLoaded(false);

    // The account's online copy wins, so every browser shows the same kit.
    // A kit that only exists in this browser (saved before syncing existed)
    // is uploaded once.
    (async () => {
      let local = null;
      try {
        const raw = await AsyncStorage.getItem(storageKeyFor(uid));
        local = raw ? JSON.parse(raw) : null;
      } catch (error) {
        console.log('Brand kit load error:', error);
      }

      let remote = null;
      try {
        remote = await loadRemoteBrandKit(uid);
        if (!remote && local && uid) await saveRemoteBrandKit(uid, local);
      } catch (error) {
        console.log('Brand kit sync error:', error?.message || error);
      }

      if (cancelled) return;
      const kit = remote || local;
      setBrandKit(kit ? { ...EMPTY_BRAND_KIT, ...kit } : EMPTY_BRAND_KIT);
      if (remote) AsyncStorage.setItem(storageKeyFor(uid), JSON.stringify(remote)).catch(() => {});
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, authLoading]);

  // Saves to this browser and to the account online. Throws if either fails
  // (web localStorage is ~5 MB per site; the online copy is limited to 1 MB)
  // so the Brand Kit screen can tell the user instead of losing the save.
  const saveBrandKit = async (next) => {
    let localError = null;
    let remoteError = null;
    try {
      await AsyncStorage.setItem(storageKeyFor(uid), JSON.stringify(next));
    } catch (error) {
      localError = error;
    }
    try {
      await saveRemoteBrandKit(uid, next);
    } catch (error) {
      remoteError = error;
    }

    const savedSomewhere = !localError || (brandKitSyncEnabled && uid && !remoteError);
    if (savedSomewhere) setBrandKit(next);
    if (remoteError) throw remoteError;
    if (localError && !savedSomewhere) throw localError;
  };

  const value = useMemo(() => ({ brandKit, loaded, saveBrandKit }), [brandKit, loaded, uid]);

  return <BrandKitContext.Provider value={value}>{children}</BrandKitContext.Provider>;
}

export function useBrandKit() {
  const context = useContext(BrandKitContext);
  if (!context) {
    throw new Error('useBrandKit must be used inside BrandKitProvider');
  }
  return context;
}
