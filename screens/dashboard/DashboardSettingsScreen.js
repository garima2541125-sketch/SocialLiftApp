import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import DashboardShell from './DashboardShell';
import { useAuth } from '../../src/context/AuthContext';
import { loadInstagramAccount } from '../../src/ai/instagram';
import { useTheme } from '../../src/context/ThemeContext';

const PURPLE = '#6C5CE7';
const PURPLE_LIGHT = '#EFEBFB';
const DARK_TEXT = '#1A1A1A';
const GRAY_TEXT = '#6B6B6B';
const BORDER = '#E7E3D9';
const PANEL_BG = '#FBFAF6';
const GREEN = '#3E8E5A';
const GREEN_BG = '#E9F5EC';
const RED = '#C1443A';
const RED_BG = '#FBEAE8';
const AVATAR_ORANGE = '#F35D42';

// Where "Sign out" sends the user. Change to match your actual landing route.
const FRONT_PAGE_ROUTE = '/';

// Example contact details shown under "Contact support" — replace with your
// real support email / phone once you have one.
const SUPPORT_EMAIL = 'support@sociallift.app';
const SUPPORT_PHONE = '+1 (555) 010-2020';
const SUPPORT_HOURS = 'Mon–Fri, 9am–6pm ET';

function SectionHeading({ children }) {
  return <Text style={styles.sectionHeading}>{children}</Text>;
}

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// A tappable row with an icon chip, title/subtitle, and either a chevron
// (navigates / expands) or a custom `right` element (e.g. a Switch).
function SettingsRow({ icon, iconBg, title, subtitle, right, onPress, danger, isLast }) {
  const content = (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <View style={[styles.iconChip, { backgroundColor: iconBg }]}>
        <Text style={styles.iconChipText}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && { color: RED }]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right !== undefined ? right : <Text style={styles.chevron}>›</Text>}
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
}

function Toast({ text, tone = 'success' }) {
  const colors = tone === 'error' ? { bg: RED_BG, fg: RED } : { bg: GREEN_BG, fg: GREEN };
  return (
    <View style={[styles.toast, { backgroundColor: colors.bg }]}>
      <Text style={[styles.toastText, { color: colors.fg }]}>{text}</Text>
    </View>
  );
}

const THEMES = [
  { key: 'light', label: 'Light', icon: '☀️' },
  { key: 'dark', label: 'Dark', icon: '🌙' },
  { key: 'system', label: 'System', icon: '🖥️' },
];

const PLATFORM_OPTIONS = ['Instagram', 'LinkedIn'];
const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Spanish', 'French'];
const TIMEZONE_OPTIONS = ['Asia/Kolkata (IST)', 'America/New_York (ET)', 'Europe/London (GMT)', 'Asia/Tokyo (JST)'];

const CONNECTOR_DEFS = [
  { key: 'instagram', name: 'Instagram', subtitle: 'Meta OAuth 2.0 — posts, reels & stories', icon: '📸', iconBg: '#E9F5EC' },
  { key: 'linkedin', name: 'LinkedIn', subtitle: 'OAuth 2.0 — company & personal pages', icon: '💼', iconBg: '#E9F0FC' },
];

export default function DashboardSettingsScreen() {
  const { user, signOut, getToken } = useAuth();
  const router = useRouter();

  // ---- Appearance (wired to the real ThemeContext, not local state) ----
  const { themeMode, setThemeMode } = useTheme();

  // ---- Account ----
  const [editingAccount, setEditingAccount] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [accountSaved, setAccountSaved] = useState(false);
  const [accountError, setAccountError] = useState('');

  const initials = (name || 'U').trim().charAt(0).toUpperCase() || 'U';
  const roleLabel = user?.role === 'admin' ? 'Owner' : 'Creator';

  const saveAccount = () => {
    setAccountError('');
    if (!name.trim()) {
      setAccountError('Name cannot be empty.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setAccountError('Enter a valid email address.');
      return;
    }
    setAccountSaved(true);
    setEditingAccount(false);
    setTimeout(() => setAccountSaved(false), 2500);
  };

  // ---- Connected accounts (shared between "Connected accounts" and
  // "Connected applications" so both stay in sync) ----
  const [connectors, setConnectors] = useState(
    CONNECTOR_DEFS.map((c) => ({ ...c, connected: false }))
  );
  const [connecting, setConnecting] = useState(null);

  // The Instagram account linked to this account on the AI laptop (or the
  // last copy saved to the account) shows as connected, with its handle.
  useEffect(() => {
    let cancelled = false;
    if (!user) return undefined;
    loadInstagramAccount(user.uid, getToken)
      .then((result) => {
        if (cancelled || !result) return;
        const { username, followers } = result.data;
        setConnectors((prev) =>
          prev.map((c) =>
            c.key === 'instagram'
              ? { ...c, connected: true, linked: true, subtitle: `Connected as @${username}${followers ? ` · ${followers} followers` : ''}` }
              : c
          )
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const handleConnect = (key) => {
    setConnecting(key);
    setTimeout(() => {
      setConnectors((prev) => prev.map((c) => (c.key === key ? { ...c, connected: true } : c)));
      setConnecting(null);
    }, 1200);
  };
  const handleDisconnect = (key) => {
    setConnectors((prev) => prev.map((c) => (c.key === key ? { ...c, connected: false } : c)));
  };

  // ---- Account management ----
  const [accountMgmtNotice, setAccountMgmtNotice] = useState('');

  // ---- Notifications ----
  const [approvalNotif, setApprovalNotif] = useState(true);
  const [publishingNotif, setPublishingNotif] = useState(true);
  const [failedPostNotif, setFailedPostNotif] = useState(true);

  // ---- Preferences ----
  const [defaultPlatform, setDefaultPlatform] = useState('Instagram');
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const [openPicker, setOpenPicker] = useState(null); // 'platform' | 'language' | 'timezone' | null

  // ---- Privacy & Security ----
  const [securityOpen, setSecurityOpen] = useState(false);
  const [connectedAppsOpen, setConnectedAppsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleChangePassword = () => {
    setPasswordError('');
    setPasswordSuccess(false);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Fill in all three password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  // ---- Help & Support ----
  const [helpCenterOpen, setHelpCenterOpen] = useState(false);
  const [contactSupportOpen, setContactSupportOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const submitReport = () => {
    if (!reportText.trim()) return;
    // No backend yet — wire this to your real support endpoint.
    setReportSent(true);
    setReportText('');
    setTimeout(() => setReportSent(false), 3000);
  };

  // ---- Sign out ----
  const handleSignOut = () => {
    signOut();
    router.replace(FRONT_PAGE_ROUTE);
  };

  return (
    <DashboardShell active="settings" title="Settings">
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxWidth: 640 }}>
        {/* Account */}
        <SectionHeading>Account</SectionHeading>
        <Card>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.profileName}>{name || 'Your account'}</Text>
              <Text style={styles.profileMeta}>{email || 'No email on file'}</Text>
              <Text style={styles.profileMeta}>{roleLabel}</Text>
            </View>
          </View>

          {editingAccount ? (
            <>
              <Text style={styles.fieldLabel}>Full name</Text>
              <TextInput value={name} onChangeText={setName} style={styles.textInput} placeholderTextColor={GRAY_TEXT} />
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.textInput}
                placeholderTextColor={GRAY_TEXT}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {accountError ? <Toast text={accountError} tone="error" /> : null}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.primaryBtn} onPress={saveAccount} activeOpacity={0.88}>
                  <Text style={styles.primaryBtnText}>Save changes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => setEditingAccount(false)} activeOpacity={0.85}>
                  <Text style={styles.outlineBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {accountSaved ? <Toast text="✓ Account details saved" /> : null}
              <TouchableOpacity style={styles.outlineBtn} onPress={() => setEditingAccount(true)} activeOpacity={0.85}>
                <Text style={styles.outlineBtnText}>Edit information</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>

        {/* Connected accounts */}
        <SectionHeading>Connected accounts</SectionHeading>
        <Card>
          <Text style={styles.cardIntro}>
            Social Lift publishes on your behalf using secure OAuth — we never see or store your password.
          </Text>
          {connectors.map((c, i) => (
            <SettingsRow
              key={c.key}
              icon={c.icon}
              iconBg={c.iconBg}
              title={c.name}
              subtitle={c.subtitle}
              isLast={i === connectors.length - 1}
              right={
                c.linked ? (
                  <View style={styles.connectedBadge}>
                    <Text style={styles.connectedBadgeText}>✓ Connected</Text>
                  </View>
                ) : c.connected ? (
                  <TouchableOpacity style={styles.connectedBadge} onPress={() => handleDisconnect(c.key)} activeOpacity={0.85}>
                    <Text style={styles.connectedBadgeText}>✓ Connected</Text>
                  </TouchableOpacity>
                ) : connecting === c.key ? (
                  <View style={styles.connectingBadge}>
                    <Text style={styles.connectingBadgeText}>Connecting…</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.connectBtn} onPress={() => handleConnect(c.key)} activeOpacity={0.85}>
                    <Text style={styles.connectBtnText}>Connect</Text>
                  </TouchableOpacity>
                )
              }
            />
          ))}
        </Card>

        {/* Account management */}
        <SectionHeading>Account management</SectionHeading>
        <Card>
          <SettingsRow
            icon="🔄"
            iconBg="#E9F0FC"
            title="Switch account"
            subtitle="Change the Social Lift account you're using"
            onPress={() => setAccountMgmtNotice('Multi-account switching is coming soon.')}
          />
          <SettingsRow
            icon="➕"
            iconBg={PURPLE_LIGHT}
            title="Add another account"
            subtitle="Connect another Social Lift workspace"
            isLast
            onPress={() => setAccountMgmtNotice('Adding workspaces is coming soon.')}
          />
        </Card>
        {accountMgmtNotice ? <Toast text={accountMgmtNotice} /> : null}

        {/* Appearance */}
        <SectionHeading>Appearance</SectionHeading>
        <Card>
          <Text style={styles.rowTitle}>Theme</Text>
          <Text style={styles.cardIntro}>Choose how Social Lift should look.</Text>
          <View style={styles.themeRow}>
            {THEMES.map((t) => {
              const isActive = themeMode === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.themeCard, isActive && styles.themeCardActive]}
                  onPress={() => setThemeMode(t.key)}
                  activeOpacity={0.85}
                >
                  {isActive && (
                    <View style={styles.themeCheck}>
                      <Text style={styles.themeCheckText}>✓</Text>
                    </View>
                  )}
                  <Text style={styles.themeIcon}>{t.icon}</Text>
                  <Text style={styles.themeLabel}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Notifications */}
        <SectionHeading>Notifications</SectionHeading>
        <Card>
          <SettingsRow
            icon="🔔"
            iconBg="#FBF0DC"
            title="Approval notifications"
            subtitle="Notify me when a post needs approval"
            right={<Switch value={approvalNotif} onValueChange={setApprovalNotif} trackColor={{ true: PURPLE, false: BORDER }} thumbColor="#fff" />}
          />
          <SettingsRow
            icon="📣"
            iconBg="#FBEAE8"
            title="Publishing notifications"
            subtitle="Notify me when a post is published"
            right={<Switch value={publishingNotif} onValueChange={setPublishingNotif} trackColor={{ true: PURPLE, false: BORDER }} thumbColor="#fff" />}
          />
          <SettingsRow
            icon="⚠️"
            iconBg="#FBF0DC"
            title="Failed post alerts"
            subtitle="Notify me when publishing needs attention"
            isLast
            right={<Switch value={failedPostNotif} onValueChange={setFailedPostNotif} trackColor={{ true: PURPLE, false: BORDER }} thumbColor="#fff" />}
          />
        </Card>

        {/* Preferences */}
        <SectionHeading>Preferences</SectionHeading>
        <Card>
          <SettingsRow
            icon="📱"
            iconBg={PURPLE_LIGHT}
            title="Default publishing platform"
            subtitle={defaultPlatform}
            onPress={() => setOpenPicker(openPicker === 'platform' ? null : 'platform')}
          />
          {openPicker === 'platform' && (
            <View style={styles.pickerPanel}>
              {PLATFORM_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.pickerOption}
                  onPress={() => {
                    setDefaultPlatform(opt);
                    setOpenPicker(null);
                  }}
                >
                  <Text style={[styles.pickerOptionText, opt === defaultPlatform && styles.pickerOptionTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <SettingsRow
            icon="🌐"
            iconBg="#E9F0FC"
            title="Language"
            subtitle={language}
            onPress={() => setOpenPicker(openPicker === 'language' ? null : 'language')}
          />
          {openPicker === 'language' && (
            <View style={styles.pickerPanel}>
              {LANGUAGE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.pickerOption}
                  onPress={() => {
                    setLanguage(opt);
                    setOpenPicker(null);
                  }}
                >
                  <Text style={[styles.pickerOptionText, opt === language && styles.pickerOptionTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <SettingsRow
            icon="🕐"
            iconBg="#F0EEE7"
            title="Timezone"
            subtitle={timezone}
            isLast={openPicker !== 'timezone'}
            onPress={() => setOpenPicker(openPicker === 'timezone' ? null : 'timezone')}
          />
          {openPicker === 'timezone' && (
            <View style={[styles.pickerPanel, { marginBottom: 0 }]}>
              {TIMEZONE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.pickerOption}
                  onPress={() => {
                    setTimezone(opt);
                    setOpenPicker(null);
                  }}
                >
                  <Text style={[styles.pickerOptionText, opt === timezone && styles.pickerOptionTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* Privacy & Security */}
        <SectionHeading>Privacy & Security</SectionHeading>
        <Card>
          <SettingsRow
            icon="🔒"
            iconBg="#FBF0DC"
            title="Security"
            subtitle="Password and login security"
            onPress={() => setSecurityOpen((v) => !v)}
            isLast={!securityOpen}
          />
          {securityOpen && (
            <View style={styles.expandedPanel}>
              <Text style={styles.fieldLabel}>Current password</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                style={styles.textInput}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={GRAY_TEXT}
              />
              <Text style={styles.fieldLabel}>New password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.textInput}
                secureTextEntry
                placeholder="At least 8 characters"
                placeholderTextColor={GRAY_TEXT}
              />
              <Text style={styles.fieldLabel}>Confirm new password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.textInput}
                secureTextEntry
                placeholder="Repeat new password"
                placeholderTextColor={GRAY_TEXT}
              />
              {passwordError ? <Toast text={passwordError} tone="error" /> : passwordSuccess ? <Toast text="✓ Password updated" /> : null}
              <TouchableOpacity style={styles.primaryBtn} onPress={handleChangePassword} activeOpacity={0.88}>
                <Text style={styles.primaryBtnText}>Update password</Text>
              </TouchableOpacity>
            </View>
          )}

          <SettingsRow
            icon="🔗"
            iconBg="#F0EEE7"
            title="Connected applications"
            subtitle="Manage applications connected to Social Lift"
            isLast={!connectedAppsOpen}
            onPress={() => setConnectedAppsOpen((v) => !v)}
          />
          {connectedAppsOpen && (
            <View style={styles.expandedPanel}>
              {connectors.map((c) => (
                <SettingsRow
                  key={c.key}
                  icon={c.icon}
                  iconBg={c.iconBg}
                  title={c.name}
                  subtitle={c.linked ? c.subtitle : c.connected ? 'Connected' : 'Not connected'}
                  isLast={c.key === connectors[connectors.length - 1].key}
                  right={
                    c.connected ? (
                      <TouchableOpacity style={styles.connectedBadge} onPress={() => handleDisconnect(c.key)} activeOpacity={0.85}>
                        <Text style={styles.connectedBadgeText}>Disconnect</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.connectBtn} onPress={() => handleConnect(c.key)} activeOpacity={0.85}>
                        <Text style={styles.connectBtnText}>Connect</Text>
                      </TouchableOpacity>
                    )
                  }
                />
              ))}
            </View>
          )}
        </Card>

        {/* Help & Support */}
        <SectionHeading>Help & Support</SectionHeading>
        <Card>
          <SettingsRow
            icon="❓"
            iconBg="#FBEAE8"
            title="Help center"
            subtitle="Get help using Social Lift"
            isLast={!helpCenterOpen}
            onPress={() => setHelpCenterOpen((v) => !v)}
          />
          {helpCenterOpen && (
            <View style={styles.expandedPanel}>
              <View style={styles.helpLinkRow}>
                <Text style={styles.helpLinkTitle}>Getting started with Social Lift</Text>
                <Text style={styles.helpLinkBody}>Setting up your brand kit, connecting accounts, and creating your first post.</Text>
              </View>
              <View style={styles.helpLinkRow}>
                <Text style={styles.helpLinkTitle}>Understanding the Review Queue</Text>
                <Text style={styles.helpLinkBody}>How approvals, scheduling, and retries work.</Text>
              </View>
              <View style={[styles.helpLinkRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.helpLinkTitle}>Reading your Analytics</Text>
                <Text style={styles.helpLinkBody}>What reach, engagement rate, and follower growth actually measure.</Text>
              </View>
            </View>
          )}

          <SettingsRow
            icon="💬"
            iconBg="#F0EEE7"
            title="Contact support"
            subtitle="Talk to the Social Lift team"
            isLast={!contactSupportOpen}
            onPress={() => setContactSupportOpen((v) => !v)}
          />
          {contactSupportOpen && (
            <View style={styles.expandedPanel}>
              <View style={styles.contactInfoBox}>
                <Text style={styles.contactInfoLabel}>Email</Text>
                <Text style={styles.contactInfoValue}>{SUPPORT_EMAIL}</Text>
                <Text style={styles.contactInfoLabel}>Phone</Text>
                <Text style={styles.contactInfoValue}>{SUPPORT_PHONE}</Text>
                <Text style={styles.contactInfoLabel}>Hours</Text>
                <Text style={styles.contactInfoValue}>{SUPPORT_HOURS}</Text>
              </View>
            </View>
          )}

          <SettingsRow
            icon="🐞"
            iconBg="#FBEAE8"
            title="Report a problem"
            subtitle="Tell us about something that isn't working"
            isLast={!reportOpen}
            onPress={() => setReportOpen((v) => !v)}
          />
          {reportOpen && (
            <View style={styles.expandedPanel}>
              <TextInput
                value={reportText}
                onChangeText={setReportText}
                style={[styles.textInput, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="What went wrong?"
                placeholderTextColor={GRAY_TEXT}
                multiline
              />
              {reportSent ? <Toast text="✓ Thanks — we've received your report" /> : null}
              <TouchableOpacity style={styles.primaryBtn} onPress={submitReport} activeOpacity={0.88}>
                <Text style={styles.primaryBtnText}>Submit report</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Account actions */}
        <SectionHeading>Account actions</SectionHeading>
        <Card style={{ marginBottom: 50 }}>
          <SettingsRow
            icon="🚪"
            iconBg="#F5E9DC"
            title="Sign out"
            subtitle="Sign out of this Social Lift account"
            danger
            isLast
            onPress={handleSignOut}
          />
        </Card>
      </ScrollView>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  sectionHeading: { fontSize: 12.5, fontWeight: '700', color: DARK_TEXT, marginBottom: 10, marginTop: 4 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 4, marginBottom: 26, overflow: 'hidden' },
  cardIntro: { fontSize: 12, color: GRAY_TEXT, lineHeight: 17, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },

  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: BORDER },
  iconChip: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  iconChipText: { fontSize: 16 },
  rowTitle: { fontSize: 13.5, fontWeight: '700', color: DARK_TEXT },
  rowSubtitle: { fontSize: 11.5, color: GRAY_TEXT, marginTop: 2 },
  chevron: { fontSize: 20, color: GRAY_TEXT, marginLeft: 8 },

  profileRow: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 4 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: AVATAR_ORANGE, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  profileName: { fontSize: 14, fontWeight: '700', color: DARK_TEXT },
  profileMeta: { fontSize: 11.5, color: GRAY_TEXT, marginTop: 2 },

  fieldLabel: { fontSize: 11, fontWeight: '700', color: GRAY_TEXT, marginBottom: 6, marginTop: 4, marginHorizontal: 16 },
  textInput: {
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 13,
    color: DARK_TEXT,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  primaryBtn: { alignSelf: 'flex-start', backgroundColor: PURPLE, borderRadius: 9, paddingHorizontal: 18, paddingVertical: 11, marginHorizontal: 16, marginBottom: 16 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },
  outlineBtn: { alignSelf: 'flex-start', borderWidth: 1, borderColor: PURPLE, borderRadius: 9, paddingHorizontal: 18, paddingVertical: 11, marginHorizontal: 16, marginBottom: 16 },
  outlineBtnText: { color: PURPLE, fontWeight: '700', fontSize: 12.5 },

  toast: { borderRadius: 8, paddingVertical: 9, paddingHorizontal: 14, marginHorizontal: 16, marginBottom: 12 },
  toastText: { fontSize: 11.5, fontWeight: '700' },

  connectBtn: { backgroundColor: PURPLE, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  connectBtnText: { color: '#fff', fontWeight: '700', fontSize: 11.5 },
  connectingBadge: { backgroundColor: '#F0EEE7', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  connectingBadgeText: { color: GRAY_TEXT, fontWeight: '700', fontSize: 11 },
  connectedBadge: { backgroundColor: GREEN_BG, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  connectedBadgeText: { color: GREEN, fontWeight: '700', fontSize: 11 },

  themeRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingBottom: 16, flexWrap: 'wrap' },
  themeCard: {
    flex: 1,
    minWidth: 140,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 22,
    alignItems: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  themeCardActive: { backgroundColor: PURPLE_LIGHT, borderColor: PURPLE },
  themeCheck: { position: 'absolute', top: 8, right: 10, width: 16, height: 16, borderRadius: 8, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center' },
  themeCheckText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  themeIcon: { fontSize: 22, marginBottom: 8 },
  themeLabel: { fontSize: 12.5, fontWeight: '700', color: DARK_TEXT },

  pickerPanel: { backgroundColor: PANEL_BG, marginHorizontal: 16, marginBottom: 8, borderRadius: 9, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: BORDER },
  pickerOptionText: { fontSize: 12.5, color: DARK_TEXT },
  pickerOptionTextActive: { color: PURPLE, fontWeight: '700' },

  expandedPanel: { backgroundColor: PANEL_BG, paddingTop: 14, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: BORDER },

  helpLinkRow: { paddingHorizontal: 16, paddingBottom: 14, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: BORDER },
  helpLinkTitle: { fontSize: 12.5, fontWeight: '700', color: DARK_TEXT, marginBottom: 3 },
  helpLinkBody: { fontSize: 11.5, color: GRAY_TEXT, lineHeight: 16 },

  contactInfoBox: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 14 },
  contactInfoLabel: { fontSize: 10.5, fontWeight: '700', color: GRAY_TEXT, marginTop: 8 },
  contactInfoValue: { fontSize: 13, fontWeight: '700', color: DARK_TEXT, marginTop: 2 },
});