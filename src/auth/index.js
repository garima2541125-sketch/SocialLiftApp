import firebaseProvider from './firebaseProvider';
import sqliteProvider from './sqliteProvider';

// Switch backends later by changing this one env var and restarting — no
// code changes needed. Defaults to 'firebase' (the only one currently live).
const PROVIDER_NAME = process.env.EXPO_PUBLIC_AUTH_PROVIDER || 'firebase';

const PROVIDERS = {
  firebase: firebaseProvider,
  sqlite: sqliteProvider,
};

const provider = PROVIDERS[PROVIDER_NAME];

if (!provider) {
  throw new Error(
    `Unrecognized EXPO_PUBLIC_AUTH_PROVIDER "${PROVIDER_NAME}" — expected "firebase" or "sqlite".`
  );
}

export default provider;
