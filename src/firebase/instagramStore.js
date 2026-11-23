// Keeps the last Instagram analytics an account fetched, inside its own
// users/{uid} document, so the Analytics and Settings pages still show the
// linked Instagram account when the AI laptop's sharing link is offline or
// has changed.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseReady } from './config';
import { brandKitSyncEnabled } from './brandKitStore';

const MAX_POSTS = 60;

export async function saveInstagramSnapshot(uid, data) {
  if (!brandKitSyncEnabled || !firebaseReady || !uid || !data) return;
  const snapshot = {
    username: data.username || '',
    followers: data.followers || 0,
    following: data.following || 0,
    postCount: data.postCount || 0,
    posts: (data.posts || []).slice(0, MAX_POSTS).map((p) => ({
      time: p.time,
      type: p.type,
      likes: p.likes || 0,
      comments: p.comments || 0,
      caption: (p.caption || '').slice(0, 140),
    })),
    savedAt: Date.now(),
  };
  await setDoc(doc(db, 'users', uid), { instagram: snapshot }, { mergeFields: ['instagram'] });
}

export async function loadInstagramSnapshot(uid) {
  if (!brandKitSyncEnabled || !firebaseReady || !uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data().instagram || null : null;
}
