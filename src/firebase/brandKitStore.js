// Keeps a copy of each account's Brand Kit in Firestore, inside the account's
// own users/{uid} document (the only place firestore.rules lets it write), so
// the logo and reference posts follow the account to any browser or laptop.
//
// A Firestore document holds at most 1 MiB. Reference images are already
// downscaled when added, so this fits the logo plus roughly five reference
// posts; past that, saving online fails with a clear message and the kit is
// still kept in this browser.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseReady } from './config';

const PROVIDER = process.env.EXPO_PUBLIC_AUTH_PROVIDER || 'firebase';
const MAX_BYTES = 1000 * 1000;

export const brandKitSyncEnabled = PROVIDER === 'firebase' && firebaseReady;

export class BrandKitTooLargeError extends Error {}

// Firestore rejects undefined values; JSON drops them.
const clean = (kit) => JSON.parse(JSON.stringify(kit));

export async function loadRemoteBrandKit(uid) {
  if (!brandKitSyncEnabled || !uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data().brandKit || null : null;
}

export async function saveRemoteBrandKit(uid, kit) {
  if (!brandKitSyncEnabled || !uid) return;
  const data = clean(kit);
  if (JSON.stringify(data).length > MAX_BYTES) {
    throw new BrandKitTooLargeError(
      'The Brand Kit is too large to save online (about five reference posts fit). It is saved in this browser only. Delete a reference post to sync it to your account again.'
    );
  }
  await setDoc(doc(db, 'users', uid), { brandKit: data, updatedAt: new Date() }, { mergeFields: ['brandKit', 'updatedAt'] });
}
