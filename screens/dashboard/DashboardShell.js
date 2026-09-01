import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

const PURPLE = '#6C5CE7';
const SIDEBAR_BG = '#15141A';
const SIDEBAR_TEXT = '#9A98A5';
const SIDEBAR_TEXT_MUTED = '#6B6976';
const PAGE_BG = '#F4F2EC';
const BORDER = '#E7E3D9';
const DARK_TEXT = '#1A1A1A';
const AVATAR_ORANGE = '#F35D42';

const NAV_ITEMS = [
  { key: 'create', label: 'Create', icon: '✏️', route: '/dashboard/create' },
  { key: 'review-queue', label: 'Review Queue', icon: '🗂️', route: '/dashboard/review-queue' },
  { key: 'analytics', label: 'Analytics', icon: '📊', route: '/dashboard/analytics' },
  { key: 'brand-kit', label: 'Brand Kit', icon: '🎨', route: '/dashboard/brand-kit' },
  { key: 'settings', label: 'Settings', icon: '⚙️', route: '/dashboard/settings' },
];

function NavItem({ item, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.navItem, active && styles.navItemActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
        <Text style={styles.navIcon}>{item.icon}</Text>
      </View>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
    </TouchableOpacity>
  );
}

// Shared chrome for every dashboard page: dark sidebar with nav + user
// footer on the left, a white header bar + scrollable content area on the
// right. Pass `active` (matching a NAV_ITEMS key), `title` for the header,
// and optionally `headerRight` for a page-specific control (e.g. a toggle).
export default function DashboardShell({ active, title, headerRight, children, scroll = true }) {
  const router = useRouter();
  const { user } = useAuth();

  const initials = (user?.name || 'U').trim().charAt(0).toUpperCase();
  const roleLabel = user?.role === 'admin' ? 'Owner' : 'Creator';

  const Content = scroll ? ScrollView : View;
  const contentProps = scroll
    ? { contentContainerStyle: styles.scrollContent, style: { flex: 1 } }
    : { style: styles.staticContent };

  return (
    <View style={styles.root}>
      <View style={styles.sidebar}>
        <View>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>Social Lift</Text>
          </View>

          <Text style={styles.menuLabel}>MENU</Text>
          <View style={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                active={item.key === active}
                onPress={() => router.push(item.route)}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.userFooter}
          activeOpacity={0.85}
          onPress={() => router.push('/dashboard/settings')}
        >
          {user?.photo ? (
            <View style={styles.userAvatarWrap}>
              <Text style={styles.userAvatarText}>{initials}</Text>
            </View>
          ) : (
            <View style={[styles.userAvatarWrap, { backgroundColor: AVATAR_ORANGE }]}>
              <Text style={styles.userAvatarText}>{initials}</Text>
            </View>
          )}
          <View>
            <Text style={styles.userName}>{user?.name || 'Your account'}</Text>
            <Text style={styles.userRole}>{roleLabel}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.mainCol}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          {headerRight ? <View>{headerRight}</View> : null}
        </View>

        <Content {...contentProps}>{children}</Content>
      </View>
    </View>
  );
}

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: PAGE_BG, ...(isWeb ? { minHeight: '100vh' } : {}) },

  sidebar: {
    width: 220,
    backgroundColor: SIDEBAR_BG,
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, paddingHorizontal: 4 },
  brandDot: { width: 22, height: 22, borderRadius: 6, backgroundColor: PURPLE, marginRight: 9 },
  brandText: { color: '#fff', fontWeight: '800', fontSize: 15.5, fontFamily: 'serif' },

  menuLabel: { color: SIDEBAR_TEXT_MUTED, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10, paddingHorizontal: 4 },
  navList: { gap: 3 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 9,
  },
  navItemActive: { backgroundColor: PURPLE },
  navIconWrap: { width: 22, alignItems: 'center', marginRight: 10 },
  navIconWrapActive: {},
  navIcon: { fontSize: 14 },
  navLabel: { color: SIDEBAR_TEXT, fontSize: 13, fontWeight: '600' },
  navLabelActive: { color: '#fff', fontWeight: '700' },

  userFooter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#28262F' },
  userAvatarWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  userAvatarText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  userName: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  userRole: { color: SIDEBAR_TEXT_MUTED, fontSize: 10.5, marginTop: 1 },

  mainCol: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: DARK_TEXT },

  scrollContent: { padding: 32, paddingBottom: 60 },
  staticContent: { flex: 1, padding: 32 },
});
