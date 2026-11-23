import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import DashboardShell from './DashboardShell';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

const POSTS_THIS_MONTH = 24;
const PENDING_REVIEW = 1;
const APPROVED = 19;
const NEEDS_CHANGES = 1;

const RECENT_ACTIVITY = [
  { id: 'r1', icon: '🕒', text: 'Placement season 2026 post is awaiting review', time: '2 hours ago' },
  { id: 'r2', icon: '📅', text: 'National Hackathon post is scheduled for Instagram', time: '5 hours ago' },
  { id: 'r3', icon: '🎨', text: 'Brand Kit updated with the JUET logo, colours and contact details', time: 'Last week' },
];

function StatCard({ label, value, hint, theme, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={[styles.statLabel, { color: theme.secondaryText }]}>{label}</Text>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      {!!hint && <Text style={[styles.statHint, { color: theme.secondaryText }]}>{hint}</Text>}
    </TouchableOpacity>
  );
}

function QuickAction({ icon, title, subtitle, theme, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.quickCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={styles.quickIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.quickTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.quickSubtitle, { color: theme.secondaryText }]}>{subtitle}</Text>
      </View>
      <Text style={[styles.quickArrow, { color: theme.purple }]}>→</Text>
    </TouchableOpacity>
  );
}

export default function OverviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const firstName = (user?.name || 'there').split(' ')[0];

  return (
    <DashboardShell active="overview" title="Overview">
      <Text style={[styles.welcome, { color: theme.text }]}>Welcome back, {firstName}</Text>
      <Text style={[styles.welcomeSub, { color: theme.secondaryText }]}>
        Here's how your posts are doing this month.
      </Text>

      <View style={styles.statsRow}>
        <StatCard
          theme={theme}
          label="Posts this month"
          value={String(POSTS_THIS_MONTH)}
          hint="Across all platforms"
          onPress={() => router.push('/dashboard/analytics')}
        />
        <StatCard
          theme={theme}
          label="Awaiting owner review"
          value={String(PENDING_REVIEW)}
          hint={PENDING_REVIEW ? 'Sitting in the queue' : 'All clear'}
          onPress={() => router.push('/dashboard/review-queue')}
        />
        <StatCard
          theme={theme}
          label="Approved & published"
          value={String(APPROVED)}
          hint="This month"
          onPress={() => router.push('/dashboard/review-queue')}
        />
        <StatCard
          theme={theme}
          label="Needs changes"
          value={String(NEEDS_CHANGES)}
          hint={NEEDS_CHANGES ? 'Owner left feedback' : 'Nothing pending'}
          onPress={() => router.push('/dashboard/review-queue')}
        />
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.leftCol}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick actions</Text>
          <QuickAction
            theme={theme}
            icon="✏️"
            title="Create a post"
            subtitle="Generate a new post from a prompt"
            onPress={() => router.push('/dashboard/create')}
          />
          <QuickAction
            theme={theme}
            icon="🗂️"
            title="Review queue"
            subtitle={`${PENDING_REVIEW} post${PENDING_REVIEW === 1 ? '' : 's'} in progress`}
            onPress={() => router.push('/dashboard/review-queue')}
          />
          <QuickAction
            theme={theme}
            icon="📊"
            title="Analytics"
            subtitle="See what's performing best"
            onPress={() => router.push('/dashboard/analytics')}
          />
          <QuickAction
            theme={theme}
            icon="🎨"
            title="Brand kit"
            subtitle="Colors, fonts & voice guidelines"
            onPress={() => router.push('/dashboard/brand-kit')}
          />
        </View>

        <View style={styles.rightCol}>
          <View style={[styles.activityCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>Recent activity</Text>
            {RECENT_ACTIVITY.map((item) => (
              <View key={item.id} style={styles.activityRow}>
                <Text style={styles.activityIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activityText, { color: theme.text }]}>{item.text}</Text>
                  <Text style={[styles.activityTime, { color: theme.secondaryText }]}>{item.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  welcome: { fontFamily: 'serif', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  welcomeSub: { fontSize: 12.5, marginBottom: 24 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 28 },
  statCard: { flex: 1, minWidth: 180, borderRadius: 12, padding: 16, borderWidth: 1 },
  statLabel: { fontSize: 11.5, fontWeight: '600', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  statHint: { fontSize: 11 },

  bodyRow: { flexDirection: 'row', gap: 20, flexWrap: 'wrap' },
  leftCol: { flex: 1.4, minWidth: 300, gap: 10 },
  rightCol: { flex: 1, minWidth: 260 },

  sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },

  quickCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 12, borderWidth: 1, padding: 14 },
  quickIcon: { fontSize: 18 },
  quickTitle: { fontSize: 13, fontWeight: '700' },
  quickSubtitle: { fontSize: 11.5, marginTop: 2 },
  quickArrow: { fontSize: 15, fontWeight: '700' },

  activityCard: { borderRadius: 14, borderWidth: 1, padding: 20 },
  activityRow: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  activityIcon: { fontSize: 15 },
  activityText: { fontSize: 12, fontWeight: '600', lineHeight: 17 },
  activityTime: { fontSize: 10.5, marginTop: 2 },
});