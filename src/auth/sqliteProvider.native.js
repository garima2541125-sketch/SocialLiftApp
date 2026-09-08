import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';

// Metro picks this file over sqliteProvider.web.js automatically for
// iOS/Android builds — see sqliteProvider.web.js for why the two are split.

const SESSION_KEY = '@socialliftapp/sqlite_session_uid';

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT,
    role TEXT,
    photo TEXT,
    provider TEXT NOT NULL,
    dob TEXT,
    location TEXT,
    interests TEXT,
    genre TEXT,
    creator_dna TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`;

// Maps the profile fields screens pass into updateProfileDetails()/
// completeProfile() to their SQLite column names.
const COLUMN_MAP = {
  name: 'name',
  role: 'role',
  photo: 'photo',
  dob: 'dob',
  location: 'location',
  interests: 'interests',
  genre: 'genre',
  creatorDNA: 'creator_dna',
};

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('socialliftapp.db').then(async (database) => {
      await database.execAsync(SCHEMA_SQL);
      return database;
    });
  }

  return dbPromise;
}

// =========================
// HELPERS
// =========================

async function hashPassword(password) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

function safeParseArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseObject(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function rowToProfile(row) {
  return {
    uid: row.id,
    email: row.email,
    name: row.name || '',
    role: row.role || null,
    photo: row.photo || null,
    provider: row.provider,
    dob: row.dob || '',
    location: row.location || '',
    interests: safeParseArray(row.interests),
    genre: safeParseArray(row.genre),
    creatorDNA: safeParseObject(row.creator_dna),
  };
}

// Decodes a Google ID token's payload without verifying its signature —
// there's no server here to verify against. Fine for a local/offline auth
// path; do not treat this as a security-verified identity.
function decodeJwtPayload(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const json = decodeURIComponent(
    atob(padded)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  );
  return JSON.parse(json);
}

async function getSessionUid() {
  return AsyncStorage.getItem(SESSION_KEY);
}

async function setSessionUid(uid) {
  return AsyncStorage.setItem(SESSION_KEY, uid);
}

async function clearSessionUid() {
  return AsyncStorage.removeItem(SESSION_KEY);
}

async function getUserById(id) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', id);
  return row ? rowToProfile(row) : null;
}

// =========================
// SUBSCRIBE
// =========================

function subscribe(callback) {
  let cancelled = false;

  (async () => {
    try {
      const uid = await getSessionUid();
      if (cancelled) return;

      if (!uid) {
        callback(null);
        return;
      }

      const profile = await getUserById(uid);
      if (!cancelled) callback(profile);
    } catch (error) {
      console.log('SQLite session restore error:', error);
      if (!cancelled) callback(null);
    }
  })();

  return () => {
    cancelled = true;
  };
}

// =========================
// TOKEN
// =========================

async function getToken() {
  const uid = await getSessionUid();
  return uid ? `local-sqlite-session:${uid}` : null;
}

// =========================
// REGISTER
// =========================

async function register(name, email, password) {
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db.getFirstAsync('SELECT id FROM users WHERE email = ?', normalizedEmail);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const id = Crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO users
      (id, email, password_hash, name, role, photo, provider, dob, location, interests, genre, creator_dna, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, normalizedEmail, passwordHash, name.trim(), null, null, 'local', null, null, null, null, null, now, now
  );

  await setSessionUid(id);
  return getUserById(id);
}

// =========================
// LOGIN
// =========================

async function login(email, password) {
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const row = await db.getFirstAsync('SELECT * FROM users WHERE email = ?', normalizedEmail);
  if (!row) {
    throw new Error('No account found with this email.');
  }

  if (row.provider === 'local') {
    const passwordHash = await hashPassword(password);
    if (passwordHash !== row.password_hash) {
      throw new Error('Incorrect password.');
    }
  }

  await setSessionUid(row.id);
  return rowToProfile(row);
}

// =========================
// GOOGLE LOGIN
// Expects { idToken } from expo-auth-session's useIdTokenAuthRequest.
// =========================

async function googleLogin({ idToken }) {
  const db = await getDb();
  const claims = decodeJwtPayload(idToken);
  const normalizedEmail = (claims.email || '').toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Google sign-in did not return an email address.');
  }

  let row = await db.getFirstAsync('SELECT * FROM users WHERE email = ?', normalizedEmail);

  if (!row) {
    const id = Crypto.randomUUID();
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO users
        (id, email, password_hash, name, role, photo, provider, dob, location, interests, genre, creator_dna, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, normalizedEmail, null, claims.name || '', null, claims.picture || null, 'google', null, null, null, null, null, now, now
    );

    row = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', id);
  }

  await setSessionUid(row.id);
  return rowToProfile(row);
}

// =========================
// COMPLETE PROFILE
// =========================

async function completeProfile(role, fullName) {
  const uid = await getSessionUid();
  if (!uid) {
    throw new Error('You are not logged in');
  }

  const db = await getDb();
  await db.runAsync('UPDATE users SET role = ?, name = ?, updated_at = ? WHERE id = ?', role, fullName, Date.now(), uid);

  return getUserById(uid);
}

// =========================
// UPDATE PROFILE DETAILS
// =========================

async function updateProfileDetails(profileData) {
  const uid = await getSessionUid();
  if (!uid) {
    throw new Error('You are not logged in');
  }

  const db = await getDb();

  const sets = [];
  const params = [];

  for (const [key, value] of Object.entries(profileData)) {
    const column = COLUMN_MAP[key];
    if (!column) continue;

    sets.push(`${column} = ?`);
    params.push(value && typeof value === 'object' ? JSON.stringify(value) : value);
  }

  if (sets.length > 0) {
    sets.push('updated_at = ?');
    params.push(Date.now());
    params.push(uid);

    await db.runAsync(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, ...params);
  }

  return getUserById(uid);
}

// =========================
// SIGN OUT
// =========================

async function signOut() {
  await clearSessionUid();
}

const sqliteProvider = {
  ready: true,
  subscribe,
  register,
  login,
  googleLogin,
  completeProfile,
  updateProfileDetails,
  signOut,
  getToken,
};

export default sqliteProvider;
