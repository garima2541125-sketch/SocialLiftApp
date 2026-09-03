import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

const SIDEBAR_BG = '#15141A';
const SIDEBAR_TEXT = '#9A98A5';
const SIDEBAR_TEXT_MUTED = '#6B6976';
const AVATAR_ORANGE = '#F35D42';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview',
     icon: '🏠', route: '/dashboard/overview'
   },
  {
    key: 'create',
    label: 'Create',
    icon: '✏️',
    route: '/dashboard/create',
  },
  {
    key: 'review-queue',
    label: 'Review Queue',
    icon: '🗂️',
    route: '/dashboard/review-queue',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: '📊',
    route: '/dashboard/analytics',
  },
  {
    key: 'brand-kit',
    label: 'Brand Kit',
    icon: '🎨',
    route: '/dashboard/brand-kit',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: '⚙️',
    route: '/dashboard/settings',
  },
];

function NavItem({ item, active, onPress, theme }) {
  return (
    <TouchableOpacity
      style={[
        styles.navItem,
        active && {
          backgroundColor: theme.purple,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.navIconWrap}>
        <Text style={styles.navIcon}>{item.icon}</Text>
      </View>

      <Text
        style={[
          styles.navLabel,
          active && styles.navLabelActive,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

// Shared dashboard layout:
// dark sidebar + header + scrollable/static content area
export default function DashboardShell({
  active,
  title,
  headerRight,
  children,
  scroll = true,
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();

  const initials = (user?.name || 'U')
    .trim()
    .charAt(0)
    .toUpperCase();

  const roleLabel = user?.role === 'admin' ? 'Owner' : 'Creator';

  const Content = scroll ? ScrollView : View;

  const contentProps = scroll
    ? {
        contentContainerStyle: [
          styles.scrollContent,
          {
            backgroundColor: theme.background,
          },
        ],
        style: {
          flex: 1,
          backgroundColor: theme.background,
        },
      }
    : {
        style: [
          styles.staticContent,
          {
            backgroundColor: theme.background,
          },
        ],
      };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      {/* ================= SIDEBAR ================= */}
      <View style={styles.sidebar}>
        <View>
          {/* Brand */}
          <View style={styles.brandRow}>
            <View
              style={[
                styles.brandDot,
                {
                  backgroundColor: theme.purple,
                },
              ]}
            />

            <Text style={styles.brandText}>
              Social Lift
            </Text>
          </View>

          {/* Menu heading */}
          <Text style={styles.menuLabel}>
            MENU
          </Text>

          {/* Navigation */}
          <View style={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                active={item.key === active}
                theme={theme}
                onPress={() => router.push(item.route)}
              />
            ))}
          </View>
        </View>

        {/* ================= USER FOOTER ================= */}
        <TouchableOpacity
          style={[
            styles.userFooter,
            {
              borderTopColor: '#28262F',
            },
          ]}
          activeOpacity={0.85}
          onPress={() =>
            router.push('/dashboard/settings')
          }
        >
          <View
            style={[
              styles.userAvatarWrap,
              {
                backgroundColor: AVATAR_ORANGE,
              },
            ]}
          >
            <Text style={styles.userAvatarText}>
              {initials}
            </Text>
          </View>

          <View>
            <Text style={styles.userName}>
              {user?.name || 'Your account'}
            </Text>

            <Text style={styles.userRole}>
              {roleLabel}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ================= MAIN AREA ================= */}
      <View
        style={[
          styles.mainCol,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.card,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.text,
              },
            ]}
          >
            {title}
          </Text>

          {headerRight ? (
            <View>{headerRight}</View>
          ) : null}
        </View>

        {/* Page Content */}
        <Content {...contentProps}>
          {children}
        </Content>
      </View>
    </View>
  );
}

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    ...(isWeb
      ? {
          minHeight: '100vh',
        }
      : {}),
  },

  /* ================= SIDEBAR ================= */

  sidebar: {
    width: 220,
    backgroundColor: SIDEBAR_BG,
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 4,
  },

  brandDot: {
    width: 22,
    height: 22,
    borderRadius: 6,
    marginRight: 9,
  },

  brandText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15.5,
    fontFamily: 'serif',
  },

  menuLabel: {
    color: SIDEBAR_TEXT_MUTED,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  navList: {
    gap: 3,
  },

  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 9,
  },

  navIconWrap: {
    width: 22,
    alignItems: 'center',
    marginRight: 10,
  },

  navIcon: {
    fontSize: 14,
  },

  navLabel: {
    color: SIDEBAR_TEXT,
    fontSize: 13,
    fontWeight: '600',
  },

  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* ================= USER FOOTER ================= */

  userFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 16,
    borderTopWidth: 1,
  },

  userAvatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  userAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  userName: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  userRole: {
    color: SIDEBAR_TEXT_MUTED,
    fontSize: 10.5,
    marginTop: 1,
  },

  /* ================= MAIN AREA ================= */

  mainCol: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },

  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },

  scrollContent: {
    padding: 32,
    paddingBottom: 60,
    flexGrow: 1,
  },

  staticContent: {
    flex: 1,
    padding: 32,
  },
});