// Metro picks this file over sqliteProvider.native.js automatically when
// bundling for web. It deliberately never imports 'expo-sqlite' — that
// package's web build pulls in a .wasm worker Metro can't bundle for this
// project's static export, so even an unreached reference to it here would
// break the web build. expo-sqlite's web support is alpha and would also
// need COOP/COEP response headers this app's Vercel deploy doesn't set, so
// this provider is native-only (iOS/Android) for now.

const WEB_NOT_SUPPORTED_MESSAGE =
  "The SQLite auth provider only works on iOS/Android right now — expo-sqlite's web support is still alpha. Switch back to the Firebase provider (or run this on a device/simulator) to use it.";

function unsupported() {
  throw new Error(WEB_NOT_SUPPORTED_MESSAGE);
}

const sqliteProvider = {
  ready: false,
  subscribe(callback) {
    callback(null);
    return () => {};
  },
  register: unsupported,
  login: unsupported,
  googleLogin: unsupported,
  completeProfile: unsupported,
  updateProfileDetails: unsupported,
  signOut: async () => {},
  getToken: async () => null,
};

export default sqliteProvider;
