import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useOwnerData } from '../../src/context/OwnerDataContext';

export const PURPLE = '#6C5CE7';
export const PURPLE_DARK = '#5A4BD1';
export const SIDEBAR_BG = '#15141A';
export const SIDEBAR_TEXT = '#9A98A5';
export const SIDEBAR_TEXT_MUTED = '#6B6976';
export const PAGE_BG = '#F4F2EC';
export const BORDER = '#E7E3D9';
export const DARK_TEXT = '#1A1A1A';
export const GRAY_TEXT = '#6B6B6B';
export const AVATAR_ORANGE = '#F35D42';
export const GREEN = '#2FA84F';
export const GREEN_BG = '#E6F4EA';
export const RED = '#C1443A';
export const RED_BG = '#FBEAE8';
export const AMBER = '#B5651D';
export const AMBER_BG = '#FBEEDD';
export const BLUE = '#3B6FB5';
export const BLUE_BG = '#E7EEFA';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: '🏠', route: '/owner/overview' },
  { key: 'team-seats', label: 'Team & Seats', icon: '👥', route: '/owner/team-seats' },
  { key: 'approvals', label: 'Approvals', icon: '✅', route: '/owner/approvals' },
  { key: 'brand-kits', label: 'Brand Kits', icon: '🎨', route: '/owner/brand-kits' },
  { key: 'billing', label: 'Billing', icon: '💳', route: '/owner/billing' },
];

function NavItem({ item, active, badge, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.navItem, active && styles.navItemActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.navIconWrap]}>
        <Text style={styles.navIcon}>{item.icon}</Text>
      </View>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
      {!!badge && (
        <View style={[styles.navBadge, active && styles.navBadgeActive]}>
          <Text style={[styles.navBadgeText, active && styles.navBadgeTextActive]}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Shared chrome for every owner-console page: dark sidebar with nav on the
// left, a white header bar (title + optional page action) and scrollable
// content on the right. Mirrors the creator DashboardShell so the two
// consoles feel like one product.
export default function OwnerDashboardShell({ active, title, subtitle, headerRight, children, scroll = true }) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { studioName, approvals } = useOwnerData();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = (user?.name || 'O').trim().charAt(0).toUpperCase();

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.replace('/login');
  };

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

          <Text style={styles.studioText}>{studioName}</Text>

          <Text style={styles.menuLabel}>MENU</Text>
          <View style={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                active={item.key === active}
                badge={item.key === 'approvals' ? approvals.length : null}
                onPress={() => router.push(item.route)}
              />
            ))}
          </View>
        </View>

        <View>
          {menuOpen && (
            <View style={styles.userMenu}>
              <TouchableOpacity style={styles.userMenuItem} onPress={() => { setMenuOpen(false); router.push('/owner/billing'); }}>
                <Text style={styles.userMenuItemText}>Billing & subscription</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.userMenuItem} onPress={handleSignOut}>
                <Text style={[styles.userMenuItemText, { color: RED }]}>Sign out</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.userFooter}
            activeOpacity={0.85}
            onPress={() => setMenuOpen((v) => !v)}
          >
            <View style={[styles.userAvatarWrap, { backgroundColor: AVATAR_ORANGE }]}>
              <Text style={styles.userAvatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.name || 'Studio owner'}</Text>
              <Text style={styles.userRole}>Owner</Text>
            </View>
            <Text style={styles.userMenuCaret}>{menuOpen ? '▾' : '▴'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainCol}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{title}</Text>
            {!!subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
          </View>
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
    width: 232,
    backgroundColor: SIDEBAR_BG,
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, paddingHorizontal: 4 },
  brandDot: { width: 22, height: 22, borderRadius: 6, backgroundColor: PURPLE, marginRight: 9 },
  brandText: { color: '#fff', fontWeight: '800', fontSize: 15.5, fontFamily: 'serif' },
  studioText: { color: SIDEBAR_TEXT_MUTED, fontSize: 11, marginBottom: 22, paddingHorizontal: 4 },

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
  navIcon: { fontSize: 14 },
  navLabel: { color: SIDEBAR_TEXT, fontSize: 13, fontWeight: '600', flex: 1 },
  navLabelActive: { color: '#fff', fontWeight: '700' },
  navBadge: { backgroundColor: '#28262F', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 6 },
  navBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  navBadgeText: { color: SIDEBAR_TEXT, fontSize: 10.5, fontWeight: '700' },
  navBadgeTextActive: { color: '#fff' },

  userMenu: {
    backgroundColor: '#1F1E26',
    borderRadius: 10,
    marginBottom: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2C2A34',
  },
  userMenuItem: { paddingVertical: 9, paddingHorizontal: 12 },
  userMenuItemText: { color: '#fff', fontSize: 12.5, fontWeight: '600' },
  userMenuCaret: { color: SIDEBAR_TEXT_MUTED, fontSize: 10 },

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
  headerSubtitle: { fontSize: 12, color: GRAY_TEXT, marginTop: 2 },

  scrollContent: { padding: 32, paddingBottom: 60 },
  staticContent: { flex: 1, padding: 32 },
});