const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Metro's "package exports" resolution doesn't match Firebase's exports map
// correctly (a long-standing, documented Firebase + Metro/Expo issue), which
// makes `firebase/auth`, `firebase/firestore`, etc. fail to resolve. Falling
// back to the legacy main/browser fields — which Firebase's packages also
// ship — fixes it.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
