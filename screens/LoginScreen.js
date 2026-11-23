import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';

import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

import { useAuth } from '../src/context/AuthContext';
import { showAlert } from '../src/utils/alert';

WebBrowser.maybeCompleteAuthSession();

const PURPLE = '#6C5CE7';
const RED = '#C1443A';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const PAGE_BG = '#F4F2EC';

function routeForRole(role) {
  return role === 'admin'
    ? '/admin-dashboard'
    : '/dashboard/create';
}

export default function LoginScreen() {
  const router = useRouter();

  // Backend login function
  const { login, googleLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const webClientId =
    Constants.expoConfig?.extra?.googleWebClientId;

  const redirectUri = makeRedirectUri({
    scheme: 'socialliftapp',
    path: 'oauthredirect',
  });

  const [request, response, promptAsync] =
    Google.useIdTokenAuthRequest({
      webClientId,
      redirectUri,
    });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken =
        response.params?.id_token || response.authentication?.idToken;

      if (idToken) {
        handleGoogleIdToken(idToken);
      } else {
        setGoogleLoading(false);
      }
    } else if (response?.type === 'error') {
      setGoogleLoading(false);

      console.log(
        'Google sign-in error',
        response.error
      );
    } else if (
      response?.type === 'dismiss' ||
      response?.type === 'cancel'
    ) {
      setGoogleLoading(false);
    }
  }, [response]);

  // --------------------------------------------------
  // GOOGLE LOGIN
  // --------------------------------------------------

  const handleGoogleIdToken = async (idToken) => {
    try {
      const merged = await googleLogin({ idToken });

      if (merged.role) {
        // Returning user
        router.replace(routeForRole(merged.role));
      } else {
        // First time Google user
        router.replace('/next');
      }
    } catch (err) {
      console.log(
        'Failed to fetch Google profile',
        err
      );

      showAlert(
        'Google Login Failed',
        err?.message || 'Unable to complete Google login. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    promptAsync();
  };

  // --------------------------------------------------
  // EMAIL / PASSWORD LOGIN
  // --------------------------------------------------

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert(
        'Missing Details',
        'Please enter your email and password.'
      );
      return;
    }

    try {
      setLoginLoading(true);

      // This now calls the real backend API
      const loggedInUser = await login(
        email.trim(),
        password
      );

      console.log(
        'Logged in user:',
        loggedInUser
      );

      // Go according to user's role
      if (loggedInUser.role) {
        router.replace(
          routeForRole(loggedInUser.role)
        );
      } else {
        router.replace('/next');
      }
    } catch (error) {
      console.log(
        'LOGIN FAILED:',
        error
      );

      showAlert(
        'Login Failed',
        error?.message ||
          'Invalid email or password. Please try again.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
        >
          <View style={styles.panel}>
            <View style={styles.topAccent} />

            {/* Back */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>
                ← Back
              </Text>
            </TouchableOpacity>

            {/* Heading */}
            <Text style={styles.eyebrow}>
              WELCOME BACK
            </Text>

            <Text style={styles.heading}>
              Log in to Social Lift
            </Text>

            {/* Google Login */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={
                !request || googleLoading
              }
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator
                  color={DARK_TEXT}
                />
              ) : (
                <>
                  <Image
                    source={{
                      uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                    }}
                    style={styles.googleIcon}
                  />

                  <Text
                    style={
                      styles.googleButtonText
                    }
                  >
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View
                style={styles.dividerLine}
              />

              <Text
                style={styles.dividerText}
              >
                or
              </Text>

              <View
                style={styles.dividerLine}
              />
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Work email
              </Text>

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@juet.ac.in"
                placeholderTextColor="#B9B6AC"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Password
              </Text>

              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#B9B6AC"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                loginLoading &&
                  styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loginLoading}
              activeOpacity={0.85}
            >
              {loginLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={
                    styles.loginButtonText
                  }
                >
                  Log in
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign Up */}
            <TouchableOpacity
              onPress={() =>
                router.push('/next')
              }
            >
              <Text
                style={styles.signupText}
              >
                Don't have an account?{' '}
                <Text
                  style={styles.signupLink}
                >
                  Create one
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  panel: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: PANEL_BG,
    borderRadius: 16,
    paddingVertical: 36,
    paddingHorizontal: 32,
    alignItems: 'center',
    overflow: 'hidden',

    boxShadow:
      '0px 12px 30px rgba(0, 0, 0, 0.08)',
  },

  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: PURPLE,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },

  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: GRAY_TEXT,
  },

  eyebrow: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  heading: {
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 24,
    textAlign: 'center',
  },

  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 20,
    gap: 10,

    boxShadow:
      '0px 2px 6px rgba(0, 0, 0, 0.04)',
  },

  googleIcon: {
    width: 18,
    height: 18,
  },

  googleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK_TEXT,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },

  dividerText: {
    marginHorizontal: 10,
    fontSize: 11,
    color: GRAY_TEXT,
  },

  field: {
    width: '100%',
    marginBottom: 16,
  },

  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: DARK_TEXT,
    backgroundColor: '#fff',
  },

  loginButton: {
    width: '100%',
    backgroundColor: PURPLE,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,

    boxShadow:
      '0px 6px 16px rgba(108, 92, 231, 0.28)',
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  signupText: {
    fontSize: 12.5,
    color: GRAY_TEXT,
  },

  signupLink: {
    color: PURPLE,
    fontWeight: '600',
  },
});