import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useOwnerData } from '../../src/context/OwnerDataContext';
import OwnerDashboardShell, {
  PURPLE, BORDER, DARK_TEXT, GRAY_TEXT, GREEN, GREEN_BG, AMBER, AMBER_BG,
} from './OwnerDashboardShell';

function StatCard({ label, value, hint, onPress }) {
  return (
    <TouchableOpacity style={styles.statCard} activeOpacity={0.85} onPress={onPress}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {!!hint && <Text style={styles.statHint}>{hint}</Text>}
    </TouchableOpacity>
  );
}

function QuickCard({ eyebrow, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.quickCard} activeOpacity={0.85} onPress={onPress}>
      <Text style={styles.quickEyebrow}>{eyebrow}</Text>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function OwnerOverviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { team, approvals, brandKits, plan, renewsOn, postsThisMonth, decideApproval } = useOwnerData();

  const firstName = (user?.name || 'there').split(' ')[0];
  const seatsFree = Math.max(plan.seatsMax - team.length, 0);

  const quickApprove = (id) => decideApproval(id, 'approved');
  const quickReject = (id) => decideApproval(id, 'rejected');

  return (
    <OwnerDashboardShell active="overview" title="Overview">
      <Text style={styles.welcome}>Welcome back, {firstName}</Text>
      <Text style={styles.welcomeSub}>Here's what's happening across Fernwood Studio.</Text>

      <View style={styles.statsRow}>
        <StatCard
          label="Team seats used"
          value={`${team.length} / ${plan.seatsMax}`}
          hint={`${seatsFree} seats available`}
          onPress={() => router.push('/owner/team-seats')}
        />
        <StatCard
          label="Pending approvals"
          value={String(approvals.length)}
          hint={approvals.length ? 'Needs your review' : 'All caught up'}
          onPress={() => router.push('/owner/approvals')}
        />
        <StatCard
          label="Posts this month"
          value={String(postsThisMonth)}
          hint="Across all connected accounts"
          onPress={() => router.push('/owner/approvals')}
        />
        <StatCard
          label="Plan"
          value={`${plan.name} — $${plan.price}/mo`}
          hint={`Renews Aug 12, 2026`}
          onPress={() => router.push('/owner/billing')}
        />
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.leftCol}>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Pending approvals</Text>
              <TouchableOpacity onPress={() => router.push('/owner/approvals')}>
                <Text style={styles.viewAll}>View all →</Text>
              </TouchableOpacity>
            </View>

            {approvals.length === 0 && (
              <Text style={styles.emptyText}>Nothing waiting on you right now.</Text>
            )}

            {approvals.map((item) => (
              <View key={item.id} style={styles.approvalRow}>
                <View style={styles.approvalThumb}>
                  <Text style={styles.approvalThumbEmoji}>{item.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.approvalTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.approvalMeta}>By {item.author} · {item.platform} · {item.submitted}</Text>
                </View>
                <View style={styles.approvalActions}>
                  <TouchableOpacity style={styles.rejectMiniBtn} onPress={() => quickReject(item.id)}>
                    <Text style={styles.rejectMiniBtnText}>✕</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reviewBtn} onPress={() => router.push('/owner/approvals')}>
                    <Text style={styles.reviewBtnText}>Review</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.approveMiniBtn} onPress={() => quickApprove(item.id)}>
                    <Text style={styles.approveMiniBtnText}>✓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.rightCol}>
          <QuickCard
            eyebrow="TEAM & SEATS"
            title={`${team.length} members`}
            subtitle={`${seatsFree} seats free`}
            onPress={() => router.push('/owner/team-seats')}
          />
          <QuickCard
            eyebrow="BRAND KITS"
            title={`${brandKits.length} kit${brandKits.length === 1 ? '' : 's'} configured`}
            subtitle="Colors, fonts & voice"
            onPress={() => router.push('/owner/brand-kits')}
          />
          <QuickCard
            eyebrow="BILLING & SUBSCRIPTION"
            title={`${plan.name} plan`}
            subtitle={`Renews ${renewsOn}`}
            onPress={() => router.push('/owner/billing')}
          />
        </View>
      </View>
    </OwnerDashboardShell>
  );
}

const styles = StyleSheet.create({
  welcome: { fontFamily: 'serif', fontSize: 22, fontWeight: '700', color: DARK_TEXT, marginBottom: 4 },
  welcomeSub: { fontSize: 12.5, color: GRAY_TEXT, marginBottom: 24 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 24 },
  statCard: {
    flex: 1,
    minWidth: 190,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statLabel: { fontSize: 11.5, color: GRAY_TEXT, fontWeight: '600', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '700', color: DARK_TEXT, marginBottom: 6 },
  statHint: { fontSize: 11, color: GRAY_TEXT },

  bodyRow: { flexDirection: 'row', gap: 20, flexWrap: 'wrap' },
  leftCol: { flex: 2, minWidth: 340 },
  rightCol: { flex: 1, minWidth: 220, gap: 14 },

  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 20 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: DARK_TEXT },
  viewAll: { fontSize: 12, fontWeight: '700', color: PURPLE },
  emptyText: { fontSize: 12.5, color: GRAY_TEXT, paddingVertical: 12 },

  approvalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F1EFE9', gap: 12 },
  approvalThumb: { width: 38, height: 38, borderRadius: 8, backgroundColor: AMBER_BG, alignItems: 'center', justifyContent: 'center' },
  approvalThumbEmoji: { fontSize: 17 },
  approvalTitle: { fontSize: 12.5, fontWeight: '700', color: DARK_TEXT },
  approvalMeta: { fontSize: 11, color: GRAY_TEXT, marginTop: 2 },
  approvalActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewBtn: { backgroundColor: PURPLE, borderRadius: 7, paddingHorizontal: 12, paddingVertical: 7 },
  reviewBtnText: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
  approveMiniBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: GREEN_BG, alignItems: 'center', justifyContent: 'center' },
  approveMiniBtnText: { color: GREEN, fontWeight: '800', fontSize: 12 },
  rejectMiniBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FBEAE8', alignItems: 'center', justifyContent: 'center' },
  rejectMiniBtnText: { color: '#C1443A', fontWeight: '800', fontSize: 12 },

  quickCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 16 },
  quickEyebrow: { fontSize: 10, fontWeight: '700', color: PURPLE, letterSpacing: 0.8, marginBottom: 8 },
  quickTitle: { fontSize: 15, fontWeight: '700', color: DARK_TEXT, marginBottom: 3 },
  quickSubtitle: { fontSize: 11.5, color: GRAY_TEXT },
});