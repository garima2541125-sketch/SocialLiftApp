import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

const PURPLE = '#6C5CE7';
const RED = '#C1443A';
const GREEN = '#5CA85C';
const DARK = '#15141A';
const CREAM = '#EDE8E0';
const BORDER = '#E7E3D9';
const GRAY_TEXT = '#6B6B6B';

const WEEKLY_DATA = [
  { label: 'Mon', value: 5 },
  { label: 'Tue', value: 8 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 9 },
  { label: 'Fri', value: 6 },
  { label: 'Sat', value: 4 },
  { label: 'Sun', value: 10 },
];

function StatCard({ label, value, trend, trendUp }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statTrend, { color: trendUp ? GREEN : RED }]}>
        {trendUp ? '▲' : '▼'} {trend}
      </Text>
    </View>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Your posts — last 7 days</Text>
      <View style={styles.chartRow}>
        {data.map((d) => (
          <View key={d.label} style={styles.barColumn}>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { height: `${(d.value / max) * 100}%` }]} />
            </View>
            <Text style={styles.barLabel}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function UserDashboard() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoDot} />
          <Text style={styles.headerTitle}>Social Lift</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.welcomeRow}>
          {user?.photo ? (
            <Image source={{ uri: user.photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{(user?.name || 'U')[0]}</Text>
            </View>
          )}
          <View>
            <Text style={styles.eyebrow}>USER / CREATOR</Text>
            <Text style={styles.heading}>Welcome back, {user?.name || 'there'}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Posts Published" value="42" trend="6% this week" trendUp />
          <StatCard label="Engagement Rate" value="5.1%" trend="0.4% this week" trendUp />
          <StatCard label="Scheduled" value="7" trend="2 due today" trendUp={false} />
          <StatCard label="Drafts" value="3" trend="1 needs review" trendUp={false} />
        </View>

        <BarChart data={WEEKLY_DATA} />

        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Generate today's post</Text>
            <Text style={styles.cardDesc}>Start from a prompt and let Social Lift draft it for you.</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Review queue</Text>
            <Text style={styles.cardDesc}>3 posts waiting for your approval.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: DARK, marginRight: 8 },
  headerTitle: { fontWeight: '700', fontSize: 14, color: DARK },
  signOutText: { color: RED, fontWeight: '700', fontSize: 13 },

  content: { padding: 24, paddingBottom: 60, maxWidth: 900, width: '100%', alignSelf: 'center' },

  welcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: { backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 20 },
  eyebrow: { color: PURPLE, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  heading: { fontFamily: 'serif', fontSize: 22, fontWeight: '700', color: DARK },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 20 },
  statCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statLabel: { fontSize: 11.5, color: GRAY_TEXT, fontWeight: '600', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '700', color: DARK, marginBottom: 6 },
  statTrend: { fontSize: 11.5, fontWeight: '700' },

  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
  },
  chartTitle: { fontSize: 13, fontWeight: '700', color: DARK, marginBottom: 16 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 10 },
  barColumn: { flex: 1, alignItems: 'center' },
  barTrack: { width: '100%', height: 110, justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: PURPLE, borderRadius: 6, minHeight: 6 },
  barLabel: { fontSize: 10.5, color: GRAY_TEXT, marginTop: 6, fontWeight: '600' },

  cardsRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  card: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTitle: { fontWeight: '700', fontSize: 14, color: DARK, marginBottom: 6 },
  cardDesc: { fontSize: 12.5, color: GRAY_TEXT, lineHeight: 18 },
});