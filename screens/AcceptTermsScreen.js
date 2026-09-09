import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { TermsBody } from './legal/TermsOfServiceScreen';

const PURPLE = '#6C5CE7';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const PAGE_BG = '#F4F2EC';

export default function AcceptTermsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [agreed, setAgreed] = useState(false);

  // Same safeguard as the profile-details step: don't let someone land
  // here without an in-progress signup.
  useEffect(() => {
    if (!user || !user.role) {
      router.replace('/next');
    }
  }, [user]);

  const handleContinue = () => {
    if (!agreed) return;
    router.replace('/profile-details');
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.panel}>
          <View style={styles.topAccent} />

          <Text style={styles.eyebrow}>BEFORE YOU CONTINUE</Text>
          <Text style={styles.heading}>Review our Terms of Service</Text>
          <Text style={styles.subheading}>
            Please read the terms below. You'll need to agree to them before
            we can finish setting up your account.
          </Text>

          <ScrollView style={styles.termsBox} nestedScrollEnabled>
            <TermsBody />
          </ScrollView>

          <Pressable
            style={styles.agreeRow}
            onPress={() => setAgreed((prev) => !prev)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>

            <Text style={styles.agreeText}>
              I have read and agree to the{' '}
              <Text
                style={styles.agreeLink}
                onPress={() => router.push('/terms')}
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                style={styles.agreeLink}
                onPress={() => router.push('/privacy')}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </Pressable>

          <TouchableOpacity
            style={[
              styles.continueButton,
              !agreed && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={!agreed}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    maxWidth: 720,
    backgroundColor: PANEL_BG,
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 32,
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
    marginBottom: 8,
  },

  subheading: {
    fontSize: 13,
    lineHeight: 19,
    color: GRAY_TEXT,
    marginBottom: 20,
  },

  termsBox: {
    height: 320,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 20,
  },

  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 22,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  checkboxChecked: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },

  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  agreeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: DARK_TEXT,
  },

  agreeLink: {
    color: PURPLE,
    fontWeight: '700',
  },

  continueButton: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueButtonDisabled: {
    opacity: 0.4,
  },

  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
