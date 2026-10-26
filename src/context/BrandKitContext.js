import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

// The Brand Kit is saved on this device (AsyncStorage — localStorage on web),
// separately for each signed-in account, so it survives reloads and the
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

    AsyncStorage.getItem(storageKeyFor(uid))
      .then((raw) => {
        if (!cancelled) setBrandKit(raw ? { ...EMPTY_BRAND_KIT, ...JSON.parse(raw) } : EMPTY_BRAND_KIT);
      })
      .catch((error) => console.log('Brand kit load error:', error))
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [uid, authLoading]);

  // Throws if storage is full (web localStorage is ~5 MB per site) so the
  // Brand Kit screen can tell the user instead of silently losing the save.
  const saveBrandKit = async (next) => {
    await AsyncStorage.setItem(storageKeyFor(uid), JSON.stringify(next));
    setBrandKit(next);
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
