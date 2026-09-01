import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import DashboardShell from './DashboardShell';
import { useAuth } from '../../src/context/AuthContext';

const PURPLE = '#6C5CE7';
const RED = '#C1443A';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const ACCENT_TINT = '#EFECFD';
const GREEN_TINT = '#E4F3E8';
const GREEN_TEXT = '#3D6849';

// Mirrors the OAuth providers offered during onboarding.
const ACCOUNTS = [
  { key: 'instagram', name: 'Instagram', subtitle: 'Meta OAuth 2.0 — posts, reels & stories', icon: '📷' },
  { key: 'linkedin', name: 'LinkedIn', subtitle: 'OAuth 2.0 — company & personal pages', icon: '💼' },
];

const NOTIFICATIONS = [
  { key: 'approval', label: 'Posts awaiting approval', note: 'Email me when a generated post lands in the review queue.', on: true },
  { key: 'published', label: 'Publish confirmations', note: 'Notify me once a scheduled post goes live.', on: true },
  { key: 'weekly', label: 'Weekly performance digest', note: 'A Monday summary of reach, engagement and follower growth.', on: false },
];

const DEFAULTS = [
  { key: 'autoSchedule', label: 'Auto-schedule at best time', note: 'Use the engagement heatmap to pick the slot for approved posts.', on: true },
  { key: 'requireApproval', label: 'Require manual approval', note: 'Send generated posts to the review queue before they publish.', on: true },
];

function Section({ title, note, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardNote}>{note}</Text>
      {children}
    </View>
  );
}

// react-native-web picks the thumb colour per state, so the "on" thumb needs
// its own prop there or it falls back to the platform default green.
const switchThumbProps = Platform.OS === 'web' ? { activeThumbColor: '#fff' } : {};

function ToggleRow({ label, note, value, onValueChange }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleTextCol}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleNote}>{note}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D8D4C8', true: PURPLE }}
        thumbColor="#fff"
        {...switchThumbProps}
      />
    </View>
  );
}

const initialState = (rows) => Object.fromEntries(rows.map((row) => [row.key, row.on]));

export default function DashboardSettingsScreen() {
  const router = useRouter();
  const { user, updateProfileDetails, signOut } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [connected, setConnected] = useState({ instagram: false, linkedin: false });
  const [notifications, setNotifications] = useState(() => initialState(NOTIFICATIONS));
  const [defaults, setDefaults] = useState(() => initialState(DEFAULTS));
  const [saved, setSaved] = useState(false);

  const roleLabel = user?.role === 'admin' ? 'Owner' : 'Creator';

  const handleSave = async () => {
    await updateProfileDetails({ name });
    setSaved(true);
  };

  const handleSignOut = () => {
    signOut();
    router.replace('/login');
  };

  return (
    <DashboardShell active="settings" title="Settings">
      <Text style={styles.heading}>Settings</Text>
      <Text style={styles.subheading}>Manage your profile, connected platforms and publishing defaults.</Text>

      <Section title="Profile" note="How your name appears on posts and in the workspace.">
        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Display name</Text>
            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);
                setSaved(false);
              }}
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#B9B6AC"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={[styles.input, styles.inputDisabled]}
              editable={false}
              placeholder="you@example.com"
              placeholderTextColor="#B9B6AC"
            />
          </View>
        </View>
        <View style={styles.roleRow}>
          <Text style={styles.fieldLabel}>Role</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{roleLabel}</Text>
          </View>
        </View>
      </Section>

      <Section title="Connected accounts" note="Social Lift publishes on your behalf using OAuth. Reconnect anytime.">
        <View style={styles.accountList}>
          {ACCOUNTS.map((account) => {
            const isConnected = connected[account.key];
            return (
              <View key={account.key} style={styles.accountRow}>
                <View style={styles.accountLeft}>
                  <View style={styles.accountIconWrap}>
                    <Text style={styles.accountIcon}>{account.icon}</Text>
                  </View>
                  <View style={styles.accountTextCol}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountSubtitle}>{account.subtitle}</Text>
                  </View>
                </View>

                {isConnected ? (
                  <View style={styles.connectedPill}>
                    <Text style={styles.connectedPillText}>✓ Connected</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.connectBtn}
                    activeOpacity={0.88}
                    onPress={() => setConnected((prev) => ({ ...prev, [account.key]: true }))}
                  >
                    <Text style={styles.connectBtnText}>Connect</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </Section>

      <Section title="Notifications" note="Choose what Social Lift emails you about.">
        {NOTIFICATIONS.map((row) => (
          <ToggleRow
            key={row.key}
            label={row.label}
            note={row.note}
            value={notifications[row.key]}
            onValueChange={(value) => {
              setNotifications((prev) => ({ ...prev, [row.key]: value }));
              setSaved(false);
            }}
          />
        ))}
      </Section>

      <Section title="Publishing defaults" note="Applied to every new post unless you override them in the composer.">
        {DEFAULTS.map((row) => (
          <ToggleRow
            key={row.key}
            label={row.label}
            note={row.note}
            value={defaults[row.key]}
            onValueChange={(value) => {
              setDefaults((prev) => ({ ...prev, [row.key]: value }));
              setSaved(false);
            }}
          />
        ))}
      </Section>

      <Section title="Brand kit" note="Your current brand voice and colour, used by every generated post.">
        <TouchableOpacity
          style={styles.brandLinkRow}
          activeOpacity={0.8}
          onPress={() => router.push('/dashboard/brand-kit')}
        >
          <View style={[styles.previewDot, { backgroundColor: PURPLE }]} />
          <Text style={styles.brandLinkText}>Edit brand kit →</Text>
        </TouchableOpacity>
      </Section>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} activeOpacity={0.88}>
          <Text style={styles.primaryBtnText}>Save changes</Text>
        </TouchableOpacity>
        {saved ? <Text style={styles.savedText}>✓ Saved</Text> : null}
        <View style={styles.spacer} />
        <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: 'serif', fontSize: 22, fontWeight: '700', color: DARK_TEXT, marginBottom: 4 },
  subheading: { fontSize: 13, color: GRAY_TEXT, marginBottom: 22 },

  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    maxWidth: 720,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: DARK_TEXT },
  cardNote: { fontSize: 12, color: GRAY_TEXT, marginTop: 3, marginBottom: 16 },

  fieldRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  field: { flexGrow: 1, flexBasis: 220, minWidth: 200 },
  fieldLabel: { fontSize: 11.5, fontWeight: '700', color: GRAY_TEXT, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: DARK_TEXT,
    backgroundColor: '#fff',
  },
  inputDisabled: { backgroundColor: PANEL_BG, color: GRAY_TEXT },
  roleRow: { marginTop: 14 },
  rolePill: { alignSelf: 'flex-start', backgroundColor: ACCENT_TINT, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  rolePillText: { fontSize: 11.5, fontWeight: '700', color: PURPLE },

  accountList: { gap: 10 },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  accountLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  accountIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: PANEL_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  accountIcon: { fontSize: 15 },
  accountTextCol: { flexShrink: 1 },
  accountName: { fontSize: 13, fontWeight: '700', color: DARK_TEXT },
  accountSubtitle: { fontSize: 11, color: GRAY_TEXT, marginTop: 1 },

  connectBtn: { backgroundColor: PURPLE, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 },
  connectBtnText: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
  connectedPill: { backgroundColor: GREEN_TINT, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  connectedPillText: { color: GREEN_TEXT, fontSize: 11.5, fontWeight: '700' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 14 },
  toggleTextCol: { flexShrink: 1 },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: DARK_TEXT },
  toggleNote: { fontSize: 11.5, color: GRAY_TEXT, marginTop: 2, lineHeight: 15 },

  brandLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewDot: { width: 22, height: 22, borderRadius: 11 },
  brandLinkText: { fontSize: 12.5, fontWeight: '700', color: PURPLE },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, maxWidth: 720, marginBottom: 20 },
  primaryBtn: {
    backgroundColor: PURPLE,
    borderRadius: 9,
    paddingVertical: 12,
    paddingHorizontal: 20,
    boxShadow: '0px 6px 16px rgba(108, 92, 231, 0.28)',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  savedText: { fontSize: 12.5, fontWeight: '700', color: PURPLE },
  spacer: { flex: 1 },
  signOutText: { fontSize: 12.5, fontWeight: '700', color: RED },
});
