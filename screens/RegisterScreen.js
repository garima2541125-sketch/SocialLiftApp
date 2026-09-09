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
import { showAlert } from '../src/utils/alert';

WebBrowser.maybeCompleteAuthSession();

const PURPLE = '#6C5CE7';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const PAGE_BG = '#F4F2EC';



export default function RegisterScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isNarrow = width < 640;

  const { user, register, completeProfile, googleLogin } = useAuth();

  const [role, setRole] = useState('creator');
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');

const [googleLoading, setGoogleLoading] = useState(false);
const [loading, setLoading] = useState(false);

  const webClientId = Constants.expoConfig?.extra?.googleWebClientId;

  const redirectUri = makeRedirectUri({
    scheme: 'socialliftapp',
    path: 'oauthredirect',
  });

  console.log('GOOGLE REDIRECT URI:', redirectUri);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId,
    redirectUri,
  });

  useEffect(() => {
    if (user?.name) {
      setFullName(user.name);
    }

    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

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
      console.log('Google sign-in error', response.error);
    } else if (
      response?.type === 'dismiss' ||
      response?.type === 'cancel'
    ) {
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleIdToken = async (idToken) => {
    try {
      const merged = await googleLogin({ idToken });

      if (merged.role) {
        // Already has an account — skip role picking, go straight in.
        router.replace(
          merged.role === 'admin' ? '/admin-dashboard' : '/dashboard/create'
        );
      }
      // else: stay on this page — form below is now prefilled, just needs a role pick.
    } catch (err) {
      console.log('Failed to fetch Google profile', err);

      showAlert(
        'Google Sign Up Failed',
        err?.message || 'Unable to get your Google profile.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    promptAsync();
  };
const handleCreateAccount = async () => {
  if (loading) return;

  if (!fullName.trim()) {
    showAlert(
      'Missing name',
      'Please enter your full name.'
    );
    return;
  }

  if (!email.trim()) {
    showAlert(
      'Missing email',
      'Please enter your email.'
    );
    return;
  }

  // Normal email/password signup
  if (!user?.email) {
    if (!password) {
      showAlert(
        'Missing password',
        'Please create a password.'
      );
      return;
    }

    if (password.length < 8) {
      showAlert(
        'Invalid password',
        'Password must be at least 8 characters long.'
      );
      return;
    }

    if (password !== confirmPassword) {
      showAlert(
        'Password mismatch',
        'Password and confirm password must match.'
      );
      return;
    }
  }

  try {
    setLoading(true);

    const mappedRole =
      role === 'owner' ? 'admin' : 'user';

    console.log('Starting account creation...');
    console.log('Name:', fullName.trim());
    console.log('Email:', email.trim());
    console.log('Role:', mappedRole);

    // 1. Create account in backend
    if (!user?.email) {
      await register(
        fullName.trim(),
        email.trim(),
        password
      );

      console.log('Registration successful');
    }

    // 2. Save role + full name in backend
    await completeProfile(
      mappedRole,
      fullName.trim()
    );

    console.log('Profile completed');

    // 3. Require Terms of Service agreement before collecting the rest of
    // their details (DOB, location) and preferences.
    router.replace('/accept-terms');

  } catch (error) {
    console.log(
      'CREATE ACCOUNT ERROR:',
      error
    );

    showAlert(
      'Registration failed',
      error?.message ||
        'Something went wrong while creating your account.'
    );
  } finally {
    setLoading(false);
  }
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

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>
                ← Back
              </Text>
            </TouchableOpacity>

            <Text style={styles.eyebrow}>
              CREATE YOUR ACCOUNT
            </Text>

            <Text style={styles.heading}>
              How will you use Social Lift?
            </Text>

            {/* GOOGLE */}
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
                        source={{
                          uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                        }}
                        style={styles.googleIcon}
                      />

                      <Text style={styles.googleButtonText}>
                        Sign up with Google
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />

                  <Text style={styles.dividerText}>
                    or fill in manually
                  </Text>

                  <View style={styles.dividerLine} />
                </View>
              </>
            )}

            {/* GOOGLE ACCOUNT INFO */}
            {user?.email && (
              <View style={styles.googleConfirmed}>
                {user.photo && (
                  <Image
                    source={{ uri: user.photo }}
                    style={styles.googleConfirmedAvatar}
                  />
                )}

                <Text style={styles.googleConfirmedText}>
                  Signed in as{' '}
                  <Text style={{ fontWeight: '700' }}>
                    {user.email}
                  </Text>
                  {' '}— just pick a role below.
                </Text>
              </View>
            )}

            {/* ROLE CARDS */}
            <View
              style={[
                styles.cardsRow,
                isNarrow && styles.cardsRowNarrow,
              ]}
            >
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

      {/* FULL NAME */}
<View style={styles.field}>
  <Text style={styles.label}>
    Full name
  </Text>

  <TextInput
    style={styles.input}
    value={fullName}
    onChangeText={setFullName}
    placeholder="Maya Chen"
    placeholderTextColor="#B9B6AC"
  />
</View>

{/* EMAIL */}
<View style={styles.field}>
  <Text style={styles.label}>
    Work email
  </Text>

  <TextInput
    style={[styles.input, !!user?.email && styles.inputLocked]}
    value={email}
    onChangeText={setEmail}
    placeholder="maya@fernwoodstudio.com"
    placeholderTextColor="#B9B6AC"
    keyboardType="email-address"
    autoCapitalize="none"
    autoCorrect={false}
    editable={!user?.email}
  />

  {!!user?.email && (
    <Text style={styles.lockedHint}>
      Linked to your Google account
    </Text>
  )}
</View>

{/* PASSWORD */}
{!user?.email && (
  <>
    <View style={styles.field}>
      <Text style={styles.label}>
        Password
      </Text>

      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
        placeholderTextColor="#B9B6AC"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>

    <View style={styles.field}>
      <Text style={styles.label}>
        Confirm password
      </Text>

      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter password"
        placeholderTextColor="#B9B6AC"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  </>
)}

            {/* CREATE ACCOUNT */}
            <TouchableOpacity
              style={[
                styles.createButton,
                loading && styles.createButtonDisabled,
              ]}
              onPress={handleCreateAccount}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>
                  Create account
                </Text>
              )}
            </TouchableOpacity>

            {/* LOGIN */}
            <TouchableOpacity
              onPress={() => router.push('/login')}
              disabled={loading}
            >
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginLink}>
                  Log in
                </Text>
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RoleCard({
  selected,
  onPress,
  title,
  description,
  iconColor,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.cardIcon,
          { backgroundColor: iconColor },
        ]}
      />

      <Text style={styles.cardTitle}>
        {title}
      </Text>

      <Text style={styles.cardDescription}>
        {description}
      </Text>

      {selected && (
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedBadgeText}>
            Selected
          </Text>
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minHeight: 50,
  },

  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },

  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK_TEXT,
  },

  dividerRow: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },

  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: GRAY_TEXT,
  },

  googleConfirmed: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1EEFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },

  googleConfirmedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },

  googleConfirmedText: {
    flex: 1,
    fontSize: 13,
    color: DARK_TEXT,
    lineHeight: 19,
  },

  cardsRow: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },

  cardsRowNarrow: {
    flexDirection: 'column',
  },

  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 18,
    minHeight: 170,
    backgroundColor: '#FFFFFF',
  },

  cardSelected: {
    borderColor: PURPLE,
    borderWidth: 2,
  },

  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_TEXT,
    marginBottom: 8,
  },

  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: GRAY_TEXT,
  },

  selectedBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#EEEAFE',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  selectedBadgeText: {
    color: PURPLE,
    fontSize: 10,
    fontWeight: '700',
  },

  field: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK_TEXT,
    marginBottom: 7,
  },

  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 14,
    color: DARK_TEXT,
  },

  inputLocked: {
    backgroundColor: '#F0EEE9',
    color: GRAY_TEXT,
  },

  lockedHint: {
    marginTop: 5,
    fontSize: 11,
    color: GRAY_TEXT,
  },

  createButton: {
    width: '100%',
    maxWidth: 600,
    height: 50,
    borderRadius: 10,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 18,
  },

  createButtonDisabled: {
    opacity: 0.7,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  loginText: {
    fontSize: 13,
    color: GRAY_TEXT,
  },

  loginLink: {
    color: PURPLE,
    fontWeight: '700',
  },
});