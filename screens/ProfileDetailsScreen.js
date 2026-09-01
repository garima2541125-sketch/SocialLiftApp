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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

const PURPLE = '#6C5CE7';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const PAGE_BG = '#F4F2EC';

export default function ProfileDetailsScreen() {
  const router = useRouter();
  const { user, updateProfileDetails } = useAuth();

  const [dob, setDob] = useState('');
  const [location, setLocation] = useState('');

  // Safety: if someone lands here without an in-progress signup, send them back.
  useEffect(() => {
    if (!user || !user.role) {
      router.replace('/next');
    }
  }, [user]);

  // Interests and genre used to be picked from static checkboxes here.
  // That's now handled by the Creator DNA swipe screen instead — this
  // screen just saves the basics and hands off.
  const handleContinue = async () => {
    const updated = await updateProfileDetails({ dob, location });
    if (!updated) return;
    router.replace('/creator-dna');
  };

  const handleSkip = async () => {
    const updated = await updateProfileDetails({ dob, location, interests: [], genre: [] });
    if (!updated) return;
    router.replace(updated.role === 'admin' ? '/admin-dashboard' : '/dashboard/create');
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.panel}>
            <View style={styles.topAccent} />

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.eyebrow}>ALMOST DONE</Text>
            <Text style={styles.heading}>Tell us a bit more about you</Text>
            <Text style={styles.subtitle}>
              This helps Social Lift tailor content suggestions to you.
            </Text>

            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                Signed up as {user?.role === 'admin' ? 'Owner / Admin' : 'User / Creator'}
              </Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Date of birth</Text>
                <TextInput
                  style={styles.input}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#B9B6AC"
                />
              </View>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="City, Country"
                  placeholderTextColor="#B9B6AC"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.finishButton} onPress={handleContinue} activeOpacity={0.85}>
              <Text style={styles.finishButtonText}>Continue to Creator DNA →</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  panel: {
    width: '100%',
    maxWidth: 700,
    backgroundColor: PANEL_BG,
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    overflow: 'hidden',
    boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.08)',
  },
  topAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: PURPLE },
  backButton: { alignSelf: 'flex-start', marginBottom: 20 },
  backButtonText: { fontSize: 13, fontWeight: '600', color: GRAY_TEXT },
  eyebrow: { color: PURPLE, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  heading: { fontFamily: 'serif', fontSize: 24, fontWeight: '700', color: DARK_TEXT, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 12.5, color: GRAY_TEXT, textAlign: 'center', marginBottom: 16, maxWidth: 420 },
  roleBadge: { backgroundColor: '#EDE9FB', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 24 },
  roleBadgeText: { color: PURPLE, fontSize: 11, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 16, width: '100%', maxWidth: 600, marginBottom: 8 },
  field: { width: '100%', maxWidth: 600, marginBottom: 20 },
  halfField: { flex: 1 },
  label: { fontSize: 12.5, fontWeight: '700', color: DARK_TEXT, marginBottom: 8 },
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
  finishButton: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: PURPLE,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
    boxShadow: '0px 6px 16px rgba(108, 92, 231, 0.28)',
  },
  finishButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  skipText: { fontSize: 12.5, color: GRAY_TEXT, textDecorationLine: 'underline' },
});