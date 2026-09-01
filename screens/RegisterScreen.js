import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
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

WebBrowser.maybeCompleteAuthSession();

const PURPLE = '#6C5CE7';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const PAGE_BG = '#F4F2EC';

function routeForRole(role) {
  return role === 'admin' ? '/admin-dashboard' : '/dashboard/create';
}

export default function RegisterScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isNarrow = width < 640;
  const { user, setUser, completeProfile } = useAuth();

  const [role, setRole] = useState('creator'); // 'owner' | 'creator'
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [googleLoading, setGoogleLoading] = useState(false);

 const webClientId = Constants.expoConfig?.extra?.googleWebClientId;

const redirectUri = makeRedirectUri({
  scheme: 'socialliftapp',
  path: 'oauthredirect',
});

console.log('GOOGLE REDIRECT URI:', redirectUri);

const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId,
  redirectUri,
});

  // Keep the form in sync if a Google profile arrives after mount.
  useEffect(() => {
    if (user?.name) setFullName(user.name);
    if (user?.email) setEmail(user.email);
  }, [user]);

  useEffect(() => {
    if (response?.type === 'success') {
      fetchGoogleProfile(response.authentication.accessToken);
    } else if (response?.type === 'error') {
      setGoogleLoading(false);
      console.log('Google sign-in error', response.error);
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      setGoogleLoading(false);
    }
  }, [response]);

  const fetchGoogleProfile = async (accessToken) => {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = await res.json();
      const merged = await setUser({
        name: profile.name,
        email: profile.email,
        photo: profile.picture,
        provider: 'google',
      });

      if (merged.role) {
        // Already has an account — skip role picking, go straight in.
        router.replace(routeForRole(merged.role));
      }
      // else: stay on this page — form below is now prefilled, just needs a role pick.
    } catch (err) {
      console.log('Failed to fetch Google profile', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    promptAsync();
  };

  const handleCreateAccount = async () => {
    if (!fullName || !email) return;

    const mappedRole = role === 'owner' ? 'admin' : 'user';

    let activeUser = user;
    if (!activeUser) {
      activeUser = await setUser({
        name: fullName,
        email,
        photo: null,
        provider: 'local',
      });
    }

    await completeProfile(mappedRole, fullName);
    router.replace('/profile-details');
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.panel}>
            <View style={styles.topAccent} />

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.eyebrow}>CREATE YOUR ACCOUNT</Text>
            <Text style={styles.heading}>How will you use Social Lift?</Text>

            {!user?.email && (
              <>
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleSignIn}
                  disabled={!request || googleLoading}
                  activeOpacity={0.8}
                >
                  {googleLoading ? (
                    <ActivityIndicator color={DARK_TEXT} />
                  ) : (
                    <>
                      <Image
                        source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                        style={styles.googleIcon}
                      />
                      <Text style={styles.googleButtonText}>Sign up with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or fill in manually</Text>
                  <View style={styles.dividerLine} />
                </View>
              </>
            )}

            {user?.email && (
              <View style={styles.googleConfirmed}>
                {user.photo && <Image source={{ uri: user.photo }} style={styles.googleConfirmedAvatar} />}
                <Text style={styles.googleConfirmedText}>
                  Signed in as <Text style={{ fontWeight: '700' }}>{user.email}</Text> — just pick a role below.
                </Text>
              </View>
            )}

            <View style={[styles.cardsRow, isNarrow && styles.cardsRowNarrow]}>
              <RoleCard
                selected={role === 'owner'}
                onPress={() => setRole('owner')}
                title="Owner"
                description="Manage your team, brand kits, billing, and approve every post before it goes live."
                iconColor="#EDE7DD"
              />
              <RoleCard
                selected={role === 'creator'}
                onPress={() => setRole('creator')}
                title="User / Creator"
                description="Generate, review, and publish AI-assisted posts across your connected social accounts."
                iconColor={PURPLE}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Maya Chen"
                placeholderTextColor="#B9B6AC"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Work email</Text>
              <TextInput
                style={[styles.input, !!user?.email && styles.inputLocked]}
                value={email}
                onChangeText={setEmail}
                placeholder="maya@fernwoodstudio.com"
                placeholderTextColor="#B9B6AC"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!user?.email}
              />
              {!!user?.email && (
                <Text style={styles.lockedHint}>Linked to your Google account</Text>
              )}
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleCreateAccount} activeOpacity={0.85}>
              <Text style={styles.createButtonText}>Create account</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLink}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RoleCard({ selected, onPress, title, description, iconColor }) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.cardIcon, { backgroundColor: iconColor }]} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
      {selected && (
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedBadgeText}>Selected</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

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
    maxWidth: 960,
    backgroundColor: PANEL_BG,
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    overflow: 'hidden',
    boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.08)',
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
    fontSize: 26,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 24,
    textAlign: 'center',
  },
  googleButton: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 10,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.04)',
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
    maxWidth: 600,
    marginVertical: 20,
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
  googleConfirmed: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    gap: 10,
  },
  googleConfirmedAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  googleConfirmedText: {
    fontSize: 12.5,
    color: DARK_TEXT,
    flex: 1,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    maxWidth: 600,
    marginBottom: 28,
  },
  cardsRowNarrow: {
    flexDirection: 'column',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 18,
  },
  cardSelected: {
    borderColor: PURPLE,
    boxShadow: '0px 0px 0px 3px rgba(108, 92, 231, 0.12)',
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12.5,
    lineHeight: 18,
    color: GRAY_TEXT,
  },
  selectedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 10,
  },
  selectedBadgeText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: '700',
  },
  field: {
    width: '100%',
    maxWidth: 600,
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
  inputLocked: {
    backgroundColor: '#F1EFE9',
    color: GRAY_TEXT,
  },
  lockedHint: {
    fontSize: 11,
    color: GRAY_TEXT,
    marginTop: 4,
  },
  createButton: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: PURPLE,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    boxShadow: '0px 6px 16px rgba(108, 92, 231, 0.28)',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  loginText: {
    fontSize: 12.5,
    color: GRAY_TEXT,
  },
  loginLink: {
    color: PURPLE,
    fontWeight: '600',
  },
});