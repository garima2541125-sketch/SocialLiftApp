import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// The Google sign-in popup navigates here after the user grants consent.
// This page's only job is to run on the SAME origin the popup was opened
// from, hand the auth result back to the window that opened it, and close
// itself — expo-web-browser does all of that inside maybeCompleteAuthSession().
// Without this route, that navigation had nowhere to land and 404'd instead,
// leaving the popup stuck and the sign-in never completing.
WebBrowser.maybeCompleteAuthSession();

export default function OAuthRedirect() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color="#6C5CE7" />
      <Text style={styles.text}>Finishing sign-in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F2EC',
    gap: 16,
  },
  text: {
    fontSize: 14,
    color: '#6B6B6B',
  },
});
